import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // For guest / unauthorized users, only photo uploads are allowed
        if (!user && !file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image uploads are allowed for guest sessions' }, { status: 403 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const userFolder = user ? user.id : 'guest';
        const filename = `${userFolder}/${timestamp}_${sanitizedName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let uploadResult = await supabaseAdmin.storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
            await supabaseAdmin.storage.createBucket('uploads', { public: true });
            uploadResult = await supabaseAdmin.storage
                .from('uploads')
                .upload(filename, buffer, {
                    contentType: file.type,
                    upsert: false,
                });
        }

        if (uploadResult.error) {
            console.error('Upload error:', uploadResult.error);
            return NextResponse.json({ error: 'Failed to upload file: ' + uploadResult.error.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('uploads')
            .getPublicUrl(filename);

        return NextResponse.json({
            file: {
                filename: file.name,
                type: file.type,
                size: file.size,
                url: urlData.publicUrl,
                path: filename,
            },
        });

    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
