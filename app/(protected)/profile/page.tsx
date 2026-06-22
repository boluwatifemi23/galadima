"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import RoleBadge from "@/components/RoleBadge";
import { subscribeUser, unsubscribeUser } from "@/app/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function ProfilePage() {
  const user = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user.name, phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPw, setChangingPw] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => json.success && setProfileForm({ name: json.user.name, phone: json.user.phone || "" }));
  }, []);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    // Browser feature detection — deferred a tick so this isn't a synchronous
    // setState call within the effect body.
    Promise.resolve().then(() => setPushSupported(supported));
    if (!supported) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(async (reg) => {
      setSubscription(await reg.pushManager.getSubscription());
    });
  }, []);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    Promise.resolve().then(() => {
      setIsIOS(ios);
      setIsStandalone(standalone);
    });
    function handler(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not update profile");
        return;
      }
      toast.success("Profile updated");
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Could not change password");
        return;
      }
      toast.success("Password updated");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setChangingPw(false);
    }
  }

  async function handleSubscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error("Push notifications aren't configured yet");
      return;
    }
    setPushBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
      setSubscription(sub);
      await subscribeUser(JSON.parse(JSON.stringify(sub)));
      toast.success("Push notifications enabled on this device");
    } catch {
      toast.error("Could not enable push notifications");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleUnsubscribe() {
    if (!subscription) return;
    setPushBusy(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);
      await unsubscribeUser(endpoint);
      toast.success("Push notifications disabled on this device");
    } catch {
      toast.error("Could not disable push notifications");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>My Profile</h1>
          <p style={{ color: "var(--color-neutral-500)", marginTop: 4 }}>{user.employeeId} · {user.department}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>

      <div className="card">
        <div className="card-header"><h3>Profile</h3></div>
        <form onSubmit={handleProfileSave} className="card-body">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input" 
              placeholder="Enter your full name"
              value={profileForm.name} 
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input 
              className="form-input" 
              placeholder="Enter your phone number"
              value={profileForm.phone} 
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              placeholder="Your email address"
              title="Your Email Address"
              className="form-input" 
              value={user.email} 
              disabled 
              style={{ opacity: 0.6 }} 
            />
            <p className="form-hint">Contact an admin to change your email.</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header"><h3>Change Password</h3></div>
        <form onSubmit={handlePasswordChange} className="card-body">
          <div className="form-group">
            <label className="form-label required">Current Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter your current password"
              value={pwForm.currentPassword} 
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label className="form-label required">New Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter your new password"
              value={pwForm.newPassword} 
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} 
            />
            <p className="form-hint">At least 8 characters.</p>
          </div>
          <div className="form-group">
            <label className="form-label required">Confirm New Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Confirm your new password"
              value={pwForm.confirmPassword} 
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={changingPw}>
            {changingPw ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Update Password"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header"><h3>Push Notifications</h3></div>
        <div className="card-body">
          {!pushSupported ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>Not supported on this browser.</p>
          ) : subscription ? (
            <div>
              <p style={{ fontSize: "0.875rem", marginBottom: 10 }}><span className="badge badge-approved">Enabled</span> on this device.</p>
              <button className="btn btn-secondary btn-sm" onClick={handleUnsubscribe} disabled={pushBusy}>Disable on this device</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)", marginBottom: 10 }}>
                Get critical alerts pushed to this device, even when the app is closed.
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleSubscribe} disabled={pushBusy}>Enable Push Notifications</button>
            </div>
          )}
        </div>
      </div>

      {!isStandalone && (
        <div className="card">
          <div className="card-header"><h3>Install App</h3></div>
          <div className="card-body">
            {isIOS ? (
              <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}>
                On iOS: tap the Share icon, then <strong>Add to Home Screen</strong>.
              </p>
            ) : installPrompt ? (
              <button className="btn btn-primary btn-sm" onClick={handleInstall}>Install Galadima</button>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>Your browser will offer this option when available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}