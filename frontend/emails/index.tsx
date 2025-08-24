import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
interface StocksEmailProps {
  verificationCode?: string;
}
export default function StocksEmail({
  verificationCode = "596853",
}: StocksEmailProps) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  return (
    <Html>
      <Head />
      <Preview>{appName} - Verify Your Email</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={coverSection}>
            <Section style={upperSection}>
              <Heading style={h1}>Verify your email address</Heading>
              <Text style={mainText}>
                Thanks for signing up for {appName}. To get started,
                please verify your email address by entering the following code:
              </Text>
              <Section style={verificationSection}>
                <Text style={codeText}>{verificationCode}</Text>
                <Text style={validityText}>
                  (This code is valid for 1 hour)
                </Text>
              </Section>
              <Hr style={hr} />
              <Text style={footerText}>
                If you didn&apos;t request this email, you can safely ignore it.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
const main = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
};
const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};
const coverSection = {
  backgroundColor: "#222222",
  borderRadius: "8px",
  overflow: "hidden",
};
const imageSection = {
  backgroundColor: "#333333",
  padding: "40px 0",
  textAlign: "center" as const,
};
const upperSection = {
  padding: "40px",
};
const h1 = {
  color: "#00ff88",
  fontFamily:
    "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 20px",
  textAlign: "center" as const,
};
const mainText = {
  color: "#ffffff",
  fontFamily:
    "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 40px",
  textAlign: "center" as const,
};
const verificationSection = {
  backgroundColor: "#333333",
  borderRadius: "8px",
  padding: "32px",
  textAlign: "center" as const,
};
const codeText = {
  color: "#00ff88",
  fontFamily: "monospace",
  fontSize: "48px",
  fontWeight: "bold",
  letterSpacing: "8px",
  margin: "0 0 16px",
};
const validityText = {
  color: "#999999",
  fontFamily:
    "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "0",
};
const hr = {
  border: "none",
  borderTop: "1px solid #444444",
  margin: "40px 0",
};
const footerText = {
  color: "#999999",
  fontFamily:
    "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};
