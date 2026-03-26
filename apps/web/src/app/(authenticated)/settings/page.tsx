import { getServerSession } from "next-auth";

import { SettingsForm } from "@/components/settings-form";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="bg-nonley-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-semibold">Settings</h2>
        <SettingsForm user={session!.user} />
      </div>
    </main>
  );
}
