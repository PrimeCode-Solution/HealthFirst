"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Loader2, 
  Camera, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Stethoscope, 
  Pencil,
  X
} from "lucide-react";
import axios from "axios";

import {
  userProfileSchema,
  changePasswordSchema,
  UserProfileValues,
  ChangePasswordValues,
} from "@/lib/validations/user";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    image?: string | null;
    role: string;
    bio?: string | null;
    specialty?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image || null);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const profileForm = useForm<UserProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      image: user.image || "",
      bio: user.bio || "",
      specialty: user.specialty || "",
    },
  });

  useEffect(() => {
    setAvatarPreview(user.image || null);
    profileForm.reset({
      name: user.name || "",
      phone: user.phone || "",
      image: user.image || "",
      bio: user.bio || "",
      specialty: user.specialty || "",
    });
  }, [user, profileForm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploading(true);

    try {
      const { data } = await axios.post("/api/upload", {
        filename: file.name,
        contentType: file.type,
      });

      const { uploadUrl, fileKey } = data;

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      
      profileForm.setValue("image", fileKey); 
      toast.success("Imagem carregada! Clique em 'Salvar Alterações' para confirmar.");

    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload da imagem.");
      setAvatarPreview(user.image || null);
    } finally {
      setIsUploading(false);
    }
  };

  const onProfileSubmit = async (data: UserProfileValues) => {
    try {
      await axios.put("/api/users/me", data);
      toast.success("Perfil atualizado com sucesso!");
      router.refresh(); 
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (data: ChangePasswordValues) => {
    try {
      await axios.post("/api/auth/change-password", data);
      toast.success("Senha alterada com sucesso!");
      passwordForm.reset();
      setIsEditing(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Erro ao alterar senha.";
      toast.error(msg);
    }
  };

  if (!isEditing) {
    return (
      <Card className="max-w-4xl mx-auto shadow-md animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="relative pb-0">
            <div className="absolute top-6 right-6">
                <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Editar Perfil
                </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 pb-6">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-1 ring-slate-100">
                    <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                
                <div className="text-center md:text-left space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900">{user.name}</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        <Badge variant="secondary" className="px-3 py-1 text-sm">
                            {user.role === 'DOCTOR' ? 'Profissional de Saúde' : 'Paciente'}
                        </Badge>
                        {user.specialty && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                {user.specialty}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </CardHeader>
        
        <Separator />

        <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                        <UserIcon className="w-5 h-5 text-primary" />
                        Informações Pessoais
                    </h3>
                    <div className="space-y-3 pl-1">
                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="text-sm break-all">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span className="text-sm">{user.phone || "Não informado"}</span>
                        </div>
                    </div>
                </div>

                {user.role === 'DOCTOR' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                            <Stethoscope className="w-5 h-5 text-primary" />
                            Perfil Profissional
                        </h3>
                         <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px]">
                            {user.bio ? (
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {user.bio}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Nenhuma biografia cadastrada.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Editando Perfil</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-red-600">
            <X className="w-4 h-4 mr-2" />
            Cancelar Edição
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="details">Meus Dados</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>
                Atualize sua foto e informações de contato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  
                  <div className="flex flex-col items-center sm:flex-row gap-6 mb-6 p-4 bg-slate-50 rounded-lg border border-dashed">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-2 border-white shadow-sm">
                        <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                        <AvatarFallback className="text-xl bg-slate-200">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <label 
                        htmlFor="avatar-upload"
                        className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full transition-opacity cursor-pointer text-white ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                         {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </div>
                    
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="font-medium text-sm">Trocar Foto</h4>
                      <p className="text-xs text-muted-foreground">
                        Clique na imagem para alterar.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input value={user.email} disabled className="bg-slate-100 text-slate-500" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        O e-mail não pode ser alterado.
                      </FormDescription>
                    </FormItem>

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone / WhatsApp</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(00) 00000-0000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {user.role === "DOCTOR" && (
                       <FormField
                       control={profileForm.control}
                       name="specialty"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Especialidade</FormLabel>
                           <FormControl>
                             <Input {...field} placeholder="Ex: Cardiologia" />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                    )}
                  </div>

                  {user.role === "DOCTOR" && (
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biografia Profissional</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Fale um pouco sobre sua experiência..." 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={profileForm.formState.isSubmitting || isUploading}>
                      {profileForm.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Digite sua senha atual para definir uma nova.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                      {passwordForm.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Atualizar Senha
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}