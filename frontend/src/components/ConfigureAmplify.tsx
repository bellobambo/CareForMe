"use client";

import { Amplify } from "aws-amplify";
import { useEffect } from "react";

// You should place your actual AWS Cognito User Pool details here.
// You can also use environment variables: process.env.NEXT_PUBLIC_USER_POOL_ID
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_xxxxxxxxx",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "xxxxxxxxxxxxxxxxx",
    }
  }
}, { ssr: true });

export default function ConfigureAmplify() {
  return null;
}
