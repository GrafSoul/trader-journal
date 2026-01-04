import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - TODO: implement */}
      <aside className="hidden w-64 border-r border-divider bg-content1 lg:block">
        <div className="p-4">
          <h2 className="text-xl font-bold">Trader Journal</h2>
        </div>
        {/* Navigation - TODO: implement */}
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Header - TODO: implement */}
        <header className="sticky top-0 z-40 border-b border-divider bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
