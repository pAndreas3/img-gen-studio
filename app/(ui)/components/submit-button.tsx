'use client';

import { Button } from "@/components/ui/button"
import { LoaderIcon } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();


    return (
        <Button variant="secondary" type="submit">{pending && <LoaderIcon className="animate-spin mr-2 h-4 w-4" />}{label}</Button>
    );
}
