import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <RouterProvider
      router={router}
      fallbackElement={
        <div className="flex min-h-screen items-center justify-center bg-canvas text-sm font-medium text-muted">
          Loading EarnEd...
        </div>
      }
    />
  );
}
