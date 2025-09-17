import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMe, useUpdateProfile } from '@/hooks/useApiHooks';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { User as UserIcon, Save, Upload } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [preview, setPreview] = useState<string>('');

  const me = useMe();
  const update = useUpdateProfile();

  useEffect(() => {
    // hydrate from localStorage immediately
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setEmail(u?.email || '');
        setName(u?.name || '');
        setAvatarUrl(u?.avatarUrl || u?.avatar || '');
        setPreview(u?.avatarUrl || u?.avatar || '');
      } catch {}
    }
    // then refresh from backend
    me.mutate(undefined, {
      onSuccess: (u: any) => {
        if (u) {
          setEmail(u.email || '');
          setName(u.name || '');
          setAvatarUrl(u.avatarUrl || '');
          setPreview(u.avatarUrl || '');
        }
      },
    });
  }, []);

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setAvatarUrl(v);
    setPreview(v);
  };

  const onAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const u = res.data;
      if (u?.avatarUrl) {
        setPreview(u.avatarUrl);
        setAvatarUrl(u.avatarUrl);
        localStorage.setItem('auth_user', JSON.stringify(u));
        toast({ title: 'Avatar updated' });
      }
    } catch {
      toast({ title: 'Upload failed', description: 'Please try a smaller image.', variant: 'destructive' });
    }
  };

  const onSave = () => {
    update.mutate({ name, avatarUrl }, {
      onSuccess: () => toast({ title: 'Profile updated', description: 'Your changes have been saved.' }),
      onError: () => toast({ title: 'Update failed', description: 'Please try again.', variant: 'destructive' }),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary ring-1 ring-border">
            <UserIcon className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-xl text-muted-foreground">Manage your account details and avatar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Basic information linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="text-xs text-muted-foreground">Upload an image (max ~20MB). It will be stored inline for demo purposes.</div>
                <Input type="file" accept="image/*" onChange={onAvatarUpload} />
              </div>
              <div className="flex gap-3">
                <Button onClick={onSave} disabled={update.isPending}>
                  <Save className="h-4 w-4 mr-2" /> {update.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="h-64 w-64 rounded-full overflow-hidden ring-2 ring-border bg-card-hover flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-24 w-24 text-muted-foreground" />
                )}
              </div>
              <Badge variant="secondary" className="text-base py-1 px-2">{user?.name || name || '—'}</Badge>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="text-sm text-muted-foreground">Secure by JWT • You can update your display name and avatar. Email is fixed.</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;


