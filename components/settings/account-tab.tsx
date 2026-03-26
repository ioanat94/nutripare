'use client';

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteAllUserData, getSavedProducts, getSavedComparisons, getNutritionSettings } from '@/lib/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function isGoogleUser() {
  return (
    auth.currentUser?.providerData.some((p) => p.providerId === 'google.com') ??
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
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const router = useRouter();

  const googleUser = isGoogleUser();

  async function handleUpdateDisplayName(
    e: React.SyntheticEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Display name cannot be empty');
      return;
    }
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      await updateDoc(doc(db, 'users', userId), { displayName: trimmed });
      toast.success('Display name updated');
    } catch {
      toast.error('Failed to update display name');
    }
  }

  async function handleChangePassword(
    e: React.SyntheticEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPw === currentPw) {
      setPwError('New password must differ from current password');
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
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      toast.success('Password updated');
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes('wrong-password') ||
          e.message.includes('invalid-credential'))
      ) {
        setPwError('Current password is incorrect');
      } else {
        setPwError('Failed to change password');
      }
    }
  }

  async function handleDeleteAccount() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setDeleteError('');
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
      await deleteAllUserData(currentUser.uid);
      await deleteUser(currentUser);
      router.push('/');
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes('wrong-password') ||
          e.message.includes('invalid-credential'))
      ) {
        setDeleteError('Incorrect password');
      } else if (
        e instanceof Error &&
        e.message.includes('popup-closed-by-user')
      ) {
        // user cancelled the Google popup — do nothing
      } else {
        setDeleteError('Failed to delete account');
      }
    }
  }

  async function handleDownloadData() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const [products, comparisons, nutritionSettings] = await Promise.all([
      getSavedProducts(currentUser.uid),
      getSavedComparisons(currentUser.uid),
      getNutritionSettings(currentUser.uid),
    ]);
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nutripare-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const email = auth.currentUser?.email;

  return (
    <div className='flex flex-col gap-8'>
      {/* Email (readonly) */}
      {email && (
        <div className='flex flex-col gap-3 sm:max-w-sm'>
          <h3 className='font-medium'>Email</h3>
          <Input
            value={email}
            readOnly
            aria-label='Email'
            className='cursor-not-allowed text-muted-foreground focus-visible:ring-0 focus-visible:border-input'
          />
        </div>
      )}

      {/* Display name */}
      <form
        onSubmit={handleUpdateDisplayName}
        className='flex flex-col gap-3 sm:max-w-sm'
      >
        <h3 className='font-medium'>Display name</h3>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label='Display name'
        />
        <div>
          <Button
            type='submit'
            disabled={newName.trim() === displayName.trim() || !newName.trim()}
          >
            Save name
          </Button>
        </div>
      </form>

      {/* Change password — email users only */}
      {!googleUser && (
        <form
          onSubmit={handleChangePassword}
          className='flex flex-col gap-3 sm:max-w-sm'
        >
          <h3 className='font-medium'>Change password</h3>
          <PasswordInput
            placeholder='Current password'
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            aria-label='Current password'
          />
          <PasswordInput
            placeholder='New password'
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            aria-label='New password'
          />
          <PasswordInput
            placeholder='Confirm new password'
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            aria-label='Confirm new password'
          />
          {pwError && (
            <p role='alert' className='text-sm text-destructive'>
              {pwError}
            </p>
          )}
          <div>
            <Button type='submit' disabled={!currentPw || !newPw || !confirmPw}>
              Change password
            </Button>
          </div>
        </form>
      )}

      {/* Download your data */}
      <div className='flex flex-col gap-3'>
        <h3 className='font-medium'>Download your data</h3>
        <p className='text-sm text-muted-foreground'>
          Download a copy of your account data, saved products, comparisons, and nutrition settings.
        </p>
        <div>
          <Button variant='outline' onClick={handleDownloadData}>
            Download data
          </Button>
        </div>
      </div>

      {/* Delete account */}
      <div className='flex flex-col gap-3'>
        <h3 className='font-medium'>Delete account</h3>
        <p className='text-sm text-muted-foreground'>
          This action is permanent and cannot be undone. All your saved products,
          comparisons, and settings will be deleted.
        </p>
        {!showDeleteConfirm ? (
          <div>
            <Button
              variant='destructive'
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete account
            </Button>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {googleUser ? (
              <p className='text-sm font-medium'>
                You will be asked to confirm with Google.
              </p>
            ) : (
              <>
                <p className='text-sm font-medium'>
                  Enter your password to confirm
                </p>
                <div className='sm:max-w-sm'>
                  <PasswordInput
                    placeholder='Your password'
                    value={deletePw}
                    onChange={(e) => setDeletePw(e.target.value)}
                    aria-label='Password confirmation'
                  />
                </div>
              </>
            )}
            {deleteError && (
              <p role='alert' className='text-sm text-destructive'>
                {deleteError}
              </p>
            )}
            <div className='flex gap-2'>
              <Button variant='destructive' onClick={handleDeleteAccount}>
                Yes, delete
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePw('');
                  setDeleteError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
