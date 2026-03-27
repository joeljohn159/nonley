import { getServerSession } from "next-auth";

import { SettingsForm } from "@/components/settings-form";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-8 text-[18px] font-medium text-neutral-900">
          Settings
        </h2>
        <SettingsForm user={session!.user} />
      </div>
    </main>
  );
}
