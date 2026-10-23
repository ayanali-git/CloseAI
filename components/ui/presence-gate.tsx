import React, { ReactNode, CSSProperties } from "react";

export interface PresenceGateProps {
  children: (props: { gate: { style?: CSSProperties; [key: string]: any } }) => ReactNode;
}

export function PresenceGate({ children }: PresenceGateProps) {
  return <>{children({ gate: {} })}</>;
}
