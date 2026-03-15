// This component requires React dependencies to be installed
// Run 'npm install' in the backend directory to resolve JSX errors

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: any) {
    // Return a simple HTML structure without JSX for now
    return `
        <div class="app-shell sidebar">
            <aside class="app-sidebar"></aside>
            <main class="app-content sidebar overflow-x-hidden">
                <header class="app-sidebar-header">
                    ${breadcrumbs.map((crumb: any) => `<span>${crumb}</span>`).join(' / ')}
                </header>
                ${children}
            </main>
        </div>
    `;
}
