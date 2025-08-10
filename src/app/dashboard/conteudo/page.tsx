"use client";

import type React from "react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Gift,
  FileText,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Ebook {
  id: string;
  title: string;
  description: string;
  category: string;
  isPaid: boolean;
  price?: number;
  coverImage: string;
  fileUrl: string;
  downloads: number;
  status: "published" | "draft";
  createdAt: string;
}

const categories = [
  "Saúde Mental",
  "Nutrição",
  "Exercícios",
  "Medicina Preventiva",
  "Bem-estar",
  "Pediatria",
  "Geriatria",
  "Cardiologia",
];

// Schema de validação com Zod
const ebookFormSchema = z
  .object({
    title: z
      .string()
      .min(1, "Título é obrigatório")
      .min(3, "Título deve ter pelo menos 3 caracteres"),
    description: z
      .string()
      .min(1, "Descrição é obrigatória")
      .min(10, "Descrição deve ter pelo menos 10 caracteres"),
    category: z.string().min(1, "Categoria é obrigatória"),
    status: z.enum(["published", "draft"]),
    isPaid: z.boolean(),
    price: z.number().min(0, "Preço deve ser maior que 0").optional(),
    coverFile: z.any().optional(),
    ebookFile: z.any().optional(),
  })
  .refine(
    (data) => {
      // Se é pago, deve ter preço
      if (data.isPaid && (!data.price || data.price <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Preço é obrigatório para conteúdo pago",
      path: ["price"],
    },
  );

// Schema dinâmico para novo ebook (arquivo obrigatório)
const createEbookFormSchema = ebookFormSchema.extend({
  ebookFile: z
    .any()
    .refine((file) => file instanceof File, "Arquivo do ebook é obrigatório"),
});

type EbookFormData = z.infer<typeof ebookFormSchema>;

const mockEbooks: Ebook[] = [
  {
    id: "1",
    title: "Guia Completo de Alimentação Saudável",
    description: "Um guia abrangente sobre nutrição e alimentação balanceada",
    category: "Nutrição",
    isPaid: true,
    price: 29.9,
    coverImage: "/placeholder.svg?height=120&width=80",
    fileUrl: "/ebooks/alimentacao-saudavel.pdf",
    downloads: 156,
    status: "published",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Primeiros Socorros Básicos",
    description: "Manual gratuito de primeiros socorros para emergências",
    category: "Medicina Preventiva",
    isPaid: false,
    coverImage: "/placeholder.svg?height=120&width=80",
    fileUrl: "/ebooks/primeiros-socorros.pdf",
    downloads: 1243,
    status: "published",
    createdAt: "2024-01-10",
  },
];

export default function ConteudoPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>(mockEbooks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);

  // Configuração do formulário com react-hook-form e Zod
  const form = useForm<EbookFormData>({
    resolver: zodResolver(
      editingEbook ? ebookFormSchema : createEbookFormSchema,
    ),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      status: "draft",
      isPaid: false,
      price: undefined,
      coverFile: undefined,
      ebookFile: undefined,
    },
  });

  const { watch, setValue, reset } = form;
  const isPaid = watch("isPaid");

  const resetForm = () => {
    reset();
    setEditingEbook(null);
  };

  const handleSubmit = (data: EbookFormData) => {
    // Validação adicional para novo ebook
    if (!editingEbook && !data.ebookFile) {
      toast.error("Arquivo do ebook é obrigatório para novos ebooks");
      return;
    }

    const newEbook: Ebook = {
      id: editingEbook?.id || Date.now().toString(),
      title: data.title,
      description: data.description,
      category: data.category,
      isPaid: data.isPaid,
      price: data.isPaid ? data.price : undefined,
      coverImage: "/placeholder.svg?height=120&width=80",
      fileUrl: data.ebookFile
        ? `/ebooks/${data.ebookFile.name}`
        : editingEbook?.fileUrl || "",
      downloads: editingEbook?.downloads || 0,
      status: data.status,
      createdAt:
        editingEbook?.createdAt || new Date().toISOString().split("T")[0],
    };

    if (editingEbook) {
      setEbooks(ebooks.map((e) => (e.id === editingEbook.id ? newEbook : e)));
      toast.success("Ebook atualizado com sucesso!");
    } else {
      setEbooks([...ebooks, newEbook]);
      toast.success("Ebook adicionado com sucesso!");
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (ebook: Ebook) => {
    setEditingEbook(ebook);

    // Preenche o formulário com os dados do ebook
    setValue("title", ebook.title);
    setValue("description", ebook.description);
    setValue("category", ebook.category);
    setValue("isPaid", ebook.isPaid);
    setValue("price", ebook.price);
    setValue("status", ebook.status);

    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setEbooks(ebooks.filter((e) => e.id !== id));
    toast.success("Ebook removido com sucesso!");
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1">
        <div className="">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <div>
              <h1 className="mb-2 font-bold text-gray-900 sm:text-3xl">
                Gerenciar Conteúdo
              </h1>
              <p className="text-gray-600">
                Faça upload e gerencie ebooks gratuitos e pagos
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 sm:w-auto"
                  onClick={resetForm}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Ebook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEbook ? "Editar Ebook" : "Adicionar Novo Ebook"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Digite o título do ebook"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva o conteúdo do ebook"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">
                                    Rascunho
                                  </SelectItem>
                                  <SelectItem value="published">
                                    Publicado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isPaid"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Tipo de Conteúdo</FormLabel>
                              <p className="text-sm text-gray-500">
                                {isPaid
                                  ? "Conteúdo pago (assinatura)"
                                  : "Conteúdo gratuito"}
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isPaid && (
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço (R$) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="coverFile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imagem de Capa</FormLabel>
                            <div className="mt-2 flex items-center gap-4">
                              <div className="flex-1">
                                <FormControl>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      field.onChange(e.target.files?.[0])
                                    }
                                  />
                                </FormControl>
                              </div>
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ebookFile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Arquivo do Ebook {!editingEbook && "*"}
                            </FormLabel>
                            <div className="mt-2 flex items-center gap-4">
                              <div className="flex-1">
                                <FormControl>
                                  <Input
                                    type="file"
                                    accept=".pdf,.epub,.mobi"
                                    onChange={(e) =>
                                      field.onChange(e.target.files?.[0])
                                    }
                                  />
                                </FormControl>
                              </div>
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Formatos aceitos: PDF, EPUB, MOBI (máx. 50MB)
                              {editingEbook &&
                                " • Deixe em branco para manter o arquivo atual"}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {editingEbook ? "Atualizar" : "Salvar"} Ebook
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="my-4 grid grid-cols-3 gap-3 sm:my-8 sm:gap-6 md:grid-cols-3">
            <Card className="!h-fit p-2 sm:p-6">
              <CardContent className="!h-fit p-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total de Ebooks
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.length}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="!h-fit p-2 sm:p-6">
              <CardContent className="!h-fit p-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Conteúdo Gratuito
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.filter((e) => !e.isPaid).length}
                    </p>
                  </div>
                  <Gift className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="!h-fit p-2 sm:p-6">
              <CardContent className="!h-fit p-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Conteúdo Pago
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.filter((e) => e.isPaid).length}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            {/* NAO USADO */}
            {/* <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Downloads
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.reduce((sum, e) => sum + e.downloads, 0)}
                    </p>
                  </div>
                  <Download className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Ebooks Table */}
          <Card className="border-0 p-0 shadow-none sm:border sm:p-4 sm:shadow">
            <CardHeader className="p-0 sm:p-2">
              <CardTitle>Ebooks Cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="border-0 p-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ebooks.map((ebook) => (
                      <TableRow key={ebook.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={ebook.coverImage || "/placeholder.svg"}
                              alt={ebook.title}
                              className="h-12 w-10 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium">{ebook.title}</p>
                              <p className="max-w-xs truncate text-sm text-gray-500">
                                {ebook.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{ebook.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ebook.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {ebook.status === "published"
                              ? "Publicado"
                              : "Rascunho"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(ebook)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(ebook.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 md:hidden">
                {ebooks.map((ebook) => (
                  <Card
                    key={ebook.id}
                    className="border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-4">
                      {/* Header com título e ações */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-1 items-start gap-3">
                          <img
                            src={ebook.coverImage || "/placeholder.svg"}
                            alt={ebook.title}
                            className="h-16 w-12 flex-shrink-0 rounded object-cover shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-sm leading-tight font-semibold text-gray-900">
                              {ebook.title}
                            </h3>
                            <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
                              {ebook.description}
                            </p>
                          </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex flex-shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(ebook)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(ebook.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Informações organizadas em grid */}
                      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Categoria
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {ebook.category}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Status
                          </span>
                          <Badge
                            variant={
                              ebook.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className="w-fit text-xs"
                          >
                            {ebook.status === "published"
                              ? "Publicado"
                              : "Rascunho"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
