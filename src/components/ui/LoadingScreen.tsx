import { Spinner } from "@heroui/react";

export const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" color="primary" />
    </div>
  );
};
