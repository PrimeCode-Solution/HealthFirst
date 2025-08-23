import Provider from "../providers/provider";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider>{children}</Provider>;
}
