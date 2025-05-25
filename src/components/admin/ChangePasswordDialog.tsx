
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChangePasswordFormData, ChangePasswordFormSchema, User } from "@/lib/types";
import { KeyRound, Loader2 } from "lucide-react";

interface ChangePasswordDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangePassword: (userId: number, data: ChangePasswordFormData) => Promise<void>;
}

export function ChangePasswordDialog({ user, open, onOpenChange, onChangePassword }: ChangePasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: {
      password: "",
    },
  });

  if (!user) {
    return null;
  }

  async function onSubmit(values: ChangePasswordFormData) {
    setIsSubmitting(true);
    await onChangePassword(user!.id, values);
    setIsSubmitting(false);
    onOpenChange(false); // Close dialog after submission attempt
    form.reset(); // Reset form
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        form.reset();
        setIsSubmitting(false);
      }
    }}>
      <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" /> Ganti Password untuk {user.username}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Masukkan kata sandi baru untuk pengguna <span className="font-semibold">{user.username}</span>.
            <br />
            <span className="text-xs text-destructive">Peringatan: Kata sandi saat ini disimpan sebagai teks biasa.</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-1">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Minimal 6 karakter" 
                      {...field} 
                      className="bg-background border-border focus:ring-primary" 
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); form.reset(); }} className="mr-2" disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Menyimpan...' : 'Ganti Password'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
