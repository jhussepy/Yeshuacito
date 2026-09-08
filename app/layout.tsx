import type {Metadata} from "next";import "./globals.css";import {Providers} from "@/components/providers";import {Shell} from "@/components/shell";
export const metadata:Metadata={title:{default:"Nexora Academy",template:"%s · Nexora"},description:"Academia adaptativa de matemáticas, inglés y finanzas."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es" suppressHydrationWarning><body><Providers><Shell>{children}</Shell></Providers></body></html>}
