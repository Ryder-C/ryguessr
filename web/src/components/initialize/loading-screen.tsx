export const LoadingScreen = ({ error }: { error?: string }) => {
  return (
    <div className="h-dvh w-full bg-black text-white flex items-center justify-center px-6 text-center">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        "Loading UwU..."
      )}
    </div>
  );
};
