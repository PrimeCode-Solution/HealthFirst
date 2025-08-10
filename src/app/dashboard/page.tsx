"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  CalendarIcon,
  Users,
  MessageSquare,
  Settings,
  Heart,
} from "lucide-react";
import { ptBR } from "react-day-picker/locale";

const sidebarItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: CalendarIcon, label: "Consultas", active: false },
  { icon: Users, label: "Clientes", active: false },
  { icon: MessageSquare, label: "Mensagens", active: false },
  { icon: Settings, label: "Configurações", active: false },
];

const clientMessages = [
  {
    id: 1,
    name: "Sarah Thompson",
    message: "Urgente: Necessário acompanhamento",
    avatar: "/placeholder.svg?height=40&width=40",
    urgent: true,
  },
  {
    id: 2,
    name: "Mark Johnson",
    message: "Consulta geral",
    avatar: "/placeholder.svg?height=40&width=40",
    urgent: false,
  },
  {
    id: 3,
    name: "Emily Davis",
    message: "Remarcação de consultas",
    avatar: "/placeholder.svg?height=40&width=40",
    urgent: false,
  },
];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2025, 9, 5),
  ); // October 5, 2025

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1">
        <div className="">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Selecione uma data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  locale={ptBR}
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  defaultMonth={new Date(2025, 9)} // October 2025
                  className="w-full rounded-lg"
                  classNames={{
                    day_selected: "bg-green-500 text-white hover:bg-green-600",
                    day_today: "bg-gray-100 text-gray-900",
                  }}
                />
              </CardContent>
            </Card>

            {/* Client Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Consultas agendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start space-x-4 rounded-lg p-3 transition-colors hover:bg-gray-50"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={message.avatar || "/placeholder.svg"}
                          alt={message.name}
                        />
                        <AvatarFallback>
                          {message.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {message.name}
                        </p>
                        <p
                          className={`mt-1 text-sm ${message.urgent ? "font-medium text-green-600" : "text-gray-500"}`}
                        >
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
