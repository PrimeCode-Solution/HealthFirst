import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface DoctorBioProps {
  bio: string | null;
}

export function DoctorBio({ bio }: DoctorBioProps) {
  if (!bio) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Sobre o Especialista
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {bio}
        </p>
      </CardContent>
    </Card>
  );
}