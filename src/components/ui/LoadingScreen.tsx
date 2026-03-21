import { Spinner } from "@heroui/react";

export const LoadingScreen = () => {
  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <Spinner size="lg" color="primary" />
    </div>
  );
};
