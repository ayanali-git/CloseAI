import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function ensureAvatarsBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'avatars');
    if (!exists) {
      await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
      });
    } else {
      // Ensure existing bucket is public
      const bucket = buckets?.find(b => b.name === 'avatars');
      if (!bucket?.public) {
        await supabaseAdmin.storage.updateBucket('avatars', { public: true });
      }
    }
  } catch (err) {
    console.error('Error ensuring avatars bucket:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getServerAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please upload an image file (PNG, JPG, WebP, GIF).' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    await ensureAvatarsBucket();

    // Generate unique safe filename with timestamp to prevent browser cache holding old avatar
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadResult = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadResult.error && uploadResult.error.message.toLowerCase().includes('bucket not found')) {
      await supabaseAdmin.storage.createBucket('avatars', { public: true });
      uploadResult = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });
    }

    if (uploadResult.error) {
      console.error('Avatar upload storage error:', uploadResult.error);
      return NextResponse.json(
        { error: uploadResult.error.message || 'Failed to upload avatar to storage' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 1. Update public.profiles
    try {
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          avatar_url: publicUrl,
        }, { onConflict: 'id' });
    } catch (dbErr) {
      console.error('Failed to update profile in database:', dbErr);
    }

    // 2. Update auth user metadata with clean public URL (NEVER base64!)
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          avatar_url: publicUrl,
        },
      });
    } catch (authMetaErr) {
      console.error('Failed to update user_metadata:', authMetaErr);
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
    });
  } catch (error: any) {
    console.error('Avatar API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getServerAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update public.profiles
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
    } catch (dbErr) {
      console.error('Failed to clear profile avatar in database:', dbErr);
    }

    // Clear from auth user metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          avatar_url: null,
        },
      });
    } catch (authMetaErr) {
      console.error('Failed to clear user_metadata avatar:', authMetaErr);
    }

    return NextResponse.json({ success: true, avatar_url: null });
  } catch (error: any) {
    console.error('Avatar DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
