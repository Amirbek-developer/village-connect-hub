import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — QishloqNet" }] }),
  component: () => <Outlet />,
});
