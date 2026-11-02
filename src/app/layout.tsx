import "./globals.css";
import localFont from "next/font/local";
const honorSans = localFont({ src: "./fonts/HONORSansVFNormal.ttf", variable: "--font-honor-sans", display: "swap", weight: "100 900" });
export const metadata = { title: "Spiritus × Velocity Workspace", description: "Shared business workspace" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={honorSans.variable}>{children}</body></html>; }
