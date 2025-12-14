"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function UserOnboardingPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const token = getSessionToken();
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const saveOnboarding = useMutation(api.users.updateOnboarding);

  useEffect(() => {
    if (me && me.onboardingCompleted) {
      router.push("/");
    }
  }, [me, router]);

  if (me === undefined) return null; // loading
  if (!me) return <RequireLogin />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveOnboarding({
        userId: me._id,
        address: address || undefined,
        photoUrl: photoUrl || undefined,
        referralSource: referralSource || undefined,
      });
      router.push("/");
    } catch (err) {
      setError("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded-2xl shadow space-y-4">
        <h1 className="text-2xl font-bold">Complete your profile</h1>
        <p className="text-sm text-gray-600">Tell us a few things to get started.</p>

        <label className="block text-sm font-medium">Address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Your shipping address"
          required
        />

        <label className="block text-sm font-medium">Profile photo URL (optional)</label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="https://..."
        />

        <label className="block text-sm font-medium">Where did you find us?</label>
        <select
          value={referralSource}
          onChange={(e) => setReferralSource(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select one</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">YouTube</option>
          <option value="friend">Friend/Referral</option>
          <option value="search">Google/Search</option>
          <option value="other">Other</option>
        </select>

        {error ? <p className="text-red-600 text-sm">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Saving..." : "Continue"}
        </button>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
          <a
            href="/user/profile"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium underline"
          >
            Go to Profile
          </a>
        </div>
      </form>
    </div>
  );
}

function RequireLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow">Please log in to continue.</div>
    </div>
  );
}

function getSessionToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
} 