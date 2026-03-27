"use client";

import { useState } from "react";

type TabType = "private" | "groups" | "next";

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<TabType>("next");

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-neutral-900">Chat</h1>
          <p className="text-sm text-neutral-500">
            Connect with people browsing the same pages as you.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1">
          {(
            [
              { key: "next", label: "Meet Someone" },
              { key: "private", label: "Direct Messages" },
              { key: "groups", label: "Groups" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-xl border border-neutral-200 bg-white">
          {activeTab === "next" && <NextPersonSection />}
          {activeTab === "private" && <PrivateSection />}
          {activeTab === "groups" && <GroupsSection />}
        </div>

        {/* Plan Info */}
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">Free Plan</p>
              <p className="text-xs text-neutral-500">
                5 DMs, 10 skips, 2 groups per day
              </p>
            </div>
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-85">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function NextPersonSection() {
  const [status, setStatus] = useState<"idle" | "searching" | "matched">(
    "idle",
  );

  return (
    <div className="p-6">
      <div className="text-center">
        <div className="mb-4 text-4xl">&#x1F44B;</div>
        <h2 className="mb-2 text-base font-semibold text-neutral-900">
          Meet Someone New
        </h2>
        <p className="mb-6 text-sm text-neutral-500">
          Get matched with a random person browsing the same page as you. Chat
          is ephemeral and disappears when either of you leaves.
        </p>

        {status === "idle" && (
          <button
            onClick={() => setStatus("searching")}
            className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85"
          >
            Find Someone
          </button>
        )}

        {status === "searching" && (
          <div>
            <div className="mb-3 text-sm text-neutral-500">
              Looking for someone...
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-xs text-neutral-500 transition-colors hover:border-neutral-300"
            >
              Cancel
            </button>
          </div>
        )}

        {status === "matched" && (
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">
              Connected! Start chatting below.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
        <p className="text-xs text-neutral-400">
          This feature works best with the Nonley Chrome extension installed.
          The extension connects you with people in real-time on any website.
        </p>
      </div>
    </div>
  );
}

function PrivateSection() {
  return (
    <div className="p-6">
      <div className="text-center">
        <div className="mb-4 text-4xl">&#x1F4AC;</div>
        <h2 className="mb-2 text-base font-semibold text-neutral-900">
          Direct Messages
        </h2>
        <p className="text-sm text-neutral-500">
          Start a private conversation with someone you find on the same page.
          Use the Nonley extension to click the chat icon next to any user.
        </p>
        <div className="mt-6 rounded-lg bg-neutral-50 p-4">
          <p className="text-xs text-neutral-400">
            No active conversations. DMs appear here when someone accepts your
            chat request.
          </p>
        </div>
      </div>
    </div>
  );
}

function GroupsSection() {
  return (
    <div className="p-6">
      <div className="text-center">
        <div className="mb-4 text-4xl">&#x1F465;</div>
        <h2 className="mb-2 text-base font-semibold text-neutral-900">
          Group Chats
        </h2>
        <p className="text-sm text-neutral-500">
          Create or join group conversations with people on the same page. Great
          for discussing articles, videos, or events together.
        </p>
        <div className="mt-6 rounded-lg bg-neutral-50 p-4">
          <p className="text-xs text-neutral-400">
            No group chats yet. Use the extension to create one on any page.
          </p>
        </div>
      </div>
    </div>
  );
}
