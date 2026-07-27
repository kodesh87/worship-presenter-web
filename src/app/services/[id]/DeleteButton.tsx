'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      router.push('/');
      router.refresh();
    } catch (e) {
      alert('Error deleting service');
      console.error(e);
      setIsDeleting(false);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={isDeleting}
      variant="destructive"
    >
      {isDeleting ? 'Deleting...' : 'Delete Service'}
    </Button>
  );
}
