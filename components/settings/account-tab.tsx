"use client";

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  deleteAllUserData,
  getNutritionSettings,
  getSavedComparisons,
  getSavedProducts,
} from "@/lib/firestore";
import { doc, updateDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

function isGoogleUser() {
  return (
    auth.currentUser?.providerData.some((p) => p.providerId === "google.com") ??
    false
  );
}

export function AccountTab({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const [newName, setNewName] = useState(displayName);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();
  const t = useTranslations("AccountTab");

  const googleUser = isGoogleUser();

  async function handleUpdateDisplayName(
    e: React.SyntheticEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error(t("toast.displayNameEmpty"));
      return;
    }
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      await updateDoc(doc(db, "users", userId), { displayName: trimmed });
      toast.success(t("toast.displayNameUpdated"));
    } catch {
      toast.error(t("toast.displayNameFailed"));
    }
  }

  async function handleChangePassword(
    e: React.SyntheticEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) {
      setPwError(t("error.passwordMismatch"));
      return;
    }
    if (newPw === currentPw) {
      setPwError(t("error.passwordSame"));
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPw,
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success(t("toast.passwordUpdated"));
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes("wrong-password") ||
          e.message.includes("invalid-credential"))
      ) {
        setPwError(t("error.wrongPassword"));
      } else {
        setPwError(t("error.passwordFailed"));
      }
    }
  }

  async function handleDeleteAccount() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setDeleteError("");
    try {
      if (googleUser) {
        await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
      } else {
        if (!currentUser.email) return;
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          deletePw,
        );
        await reauthenticateWithCredential(currentUser, credential);
      }
      await deleteUser(currentUser);
      await deleteAllUserData(currentUser.uid);
      router.push("/");
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes("wrong-password") ||
          e.message.includes("invalid-credential"))
      ) {
        setDeleteError(t("error.incorrectPassword"));
      } else if (
        e instanceof Error &&
        e.message.includes("popup-closed-by-user")
      ) {
        // user cancelled the Google popup — do nothing
      } else {
        setDeleteError(t("error.deleteFailed"));
      }
    }
  }

  async function handleDownloadData() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    let products, comparisons, nutritionSettings;
    try {
      [products, comparisons, nutritionSettings] = await Promise.all([
        getSavedProducts(currentUser.uid),
        getSavedComparisons(currentUser.uid),
        getNutritionSettings(currentUser.uid),
      ]);
    } catch {
      toast.error(t("toast.downloadFailed"));
      return;
    }
    const data = {
      account: {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified,
        createdAt: currentUser.metadata.creationTime,
        lastSignIn: currentUser.metadata.lastSignInTime,
        providers: currentUser.providerData.map((p) => p.providerId),
      },
      nutritionSettings,
      savedProducts: products,
      savedComparisons: comparisons,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nutripare-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const email = auth.currentUser?.email;

  return (
    <div className="flex flex-col gap-8">
      {/* Email (readonly) */}
      {email && (
        <div className="flex flex-col gap-3 sm:max-w-sm">
          <h3 className="font-medium">{t("email")}</h3>
          <Input
            value={email}
            readOnly
            aria-label={t("email")}
            className="cursor-not-allowed text-muted-foreground focus-visible:ring-0 focus-visible:border-input"
          />
        </div>
      )}

      {/* Display name */}
      <form
        onSubmit={handleUpdateDisplayName}
        className="flex flex-col gap-3 sm:max-w-sm"
      >
        <h3 className="font-medium">{t("displayName")}</h3>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label={t("displayName")}
        />
        <div>
          <Button
            type="submit"
            disabled={newName.trim() === displayName.trim() || !newName.trim()}
          >
            {t("saveName")}
          </Button>
        </div>
      </form>

      {/* Change password — email users only */}
      {!googleUser && (
        <form
          onSubmit={handleChangePassword}
          className="flex flex-col gap-3 sm:max-w-sm"
        >
          <h3 className="font-medium">{t("changePassword")}</h3>
          <PasswordInput
            placeholder={t("currentPassword")}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            aria-label={t("currentPassword")}
          />
          <PasswordInput
            placeholder={t("newPassword")}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            aria-label={t("newPassword")}
          />
          <PasswordInput
            placeholder={t("confirmPassword")}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            aria-label={t("confirmPassword")}
          />
          {pwError && (
            <p role="alert" className="text-sm text-destructive">
              {pwError}
            </p>
          )}
          <div>
            <Button type="submit" disabled={!currentPw || !newPw || !confirmPw}>
              {t("changePasswordBtn")}
            </Button>
          </div>
        </form>
      )}

      {/* Download your data */}
      <div className="flex flex-col gap-3">
        <h3 className="font-medium">{t("downloadData")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("downloadDataDescription")}
        </p>
        <div>
          <Button variant="outline" onClick={handleDownloadData}>
            {t("downloadDataBtn")}
          </Button>
        </div>
      </div>

      {/* Delete account */}
      <div className="flex flex-col gap-3">
        <h3 className="font-medium">{t("deleteAccount")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("deleteAccountDescription")}
        </p>
        {!showDeleteConfirm ? (
          <div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("deleteAccountBtn")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {googleUser ? (
              <p className="text-sm font-medium">{t("confirmWithGoogle")}</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {t("enterPasswordToConfirm")}
                </p>
                <div className="sm:max-w-sm">
                  <PasswordInput
                    placeholder={t("yourPassword")}
                    value={deletePw}
                    onChange={(e) => setDeletePw(e.target.value)}
                    aria-label={t("yourPassword")}
                  />
                </div>
              </>
            )}
            {deleteError && (
              <p role="alert" className="text-sm text-destructive">
                {deleteError}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteAccount}>
                {t("yesDelete")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePw("");
                  setDeleteError("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
