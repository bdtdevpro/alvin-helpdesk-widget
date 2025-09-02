import './globals.css';
export const metadata = {
    title: 'Alvin Helpdesk',
    description: 'Developed by AI Engineering Team',
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter&family=Comfortaa:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link rel="apple-touch-icon" sizes="180x180" href="/alvin-logo.png"/>
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>);
}
//# sourceMappingURL=layout.jsx.map