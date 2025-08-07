"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ptBR } from "react-day-picker/locale";

const months = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const doctors = [
  { id: "1", name: "Dr. João Silva" },
  { id: "2", name: "Dra. Maria Santos" },
  { id: "3", name: "Dr. Pedro Costa" },
];

const consultationTypes = [
  { id: "1", name: "Consulta Geral" },
  { id: "2", name: "Consulta Especializada" },
  { id: "3", name: "Retorno" },
];

const availableTimes = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
];

export default function AppointmentBooking() {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedConsultationType, setSelectedConsultationType] =
    useState<string>("");
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  // new Date(2025, 6, 5) // 5 de julho
  const [selectedTime, setSelectedTime] = useState<string>("");

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Agende sua consulta
          </h1>
          <p className="leading-relaxed text-[#598C75]">
            Escolha a data e o horário que melhor lhe convir. Selecione o médico
            e o tipo de consulta de sua preferência para ver os horários
            disponíveis.
          </p>
        </div>

        <div className="">
          {/* Seletores de tipo de médico e consulta */}
          <section className="flex flex-col-reverse pb-20 md:flex-col md:pb-0">
            {/* Calendário */}
            <div className="grid grid-cols-1 justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-4">
                <div>
                  <p>Escolha o médico e o tipo de consulta</p>
                </div>
                <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={doctorOpen}
                      className="h-12 justify-between border-gray-200 bg-white"
                    >
                      {selectedDoctor
                        ? doctors.find((doctor) => doctor.id === selectedDoctor)
                            ?.name
                        : "Selecione Médico"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar médico..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                        <CommandGroup>
                          {doctors.map((doctor) => (
                            <CommandItem
                              className="cursor-pointer"
                              key={doctor.id}
                              value={doctor.id}
                              onSelect={(currentValue) => {
                                setSelectedDoctor(
                                  currentValue === selectedDoctor
                                    ? ""
                                    : currentValue,
                                );
                                setDoctorOpen(false);
                              }}
                            >
                              {doctor.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  selectedDoctor === doctor.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Consultation Type Combobox */}
                <Popover
                  open={consultationOpen}
                  onOpenChange={setConsultationOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={consultationOpen}
                      className="h-12 justify-between border-gray-200 bg-white"
                    >
                      {selectedConsultationType
                        ? consultationTypes.find(
                            (type) => type.id === selectedConsultationType,
                          )?.name
                        : "Selecione o tipo de consulta"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar tipo de consulta..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {consultationTypes.map((type) => (
                            <CommandItem
                              className="cursor-pointer"
                              key={type.id}
                              value={type.id}
                              onSelect={(currentValue) => {
                                setSelectedConsultationType(
                                  currentValue === selectedConsultationType
                                    ? ""
                                    : currentValue,
                                );
                                setConsultationOpen(false);
                              }}
                            >
                              {type.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  selectedConsultationType === type.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Calendar
                locale={ptBR}
                mode="single"
                defaultMonth={selectedDate}
                numberOfMonths={isMobile ? 1 : 2}
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full rounded-lg p-0"
                classNames={{
                  day_button: "cursor-pointer",
                }}
              />
            </div>

            {/* Horários disponíveis */}
            <div className="mb-5 w-full md:mt-5">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Horários disponíveis
              </h2>
              <ToggleGroup
                type="single"
                value={selectedTime}
                onValueChange={setSelectedTime}
                className="grid w-full grid-cols-2 justify-start gap-3 sm:grid-cols-3 md:flex md:flex-wrap"
              >
                {availableTimes.map((time) => (
                  <ToggleGroupItem
                    key={time}
                    value={time}
                    className="data-[state=on]:bg-primary data-[state=on]:hover:bg-primary flex min-h-[44px] cursor-pointer items-center justify-center rounded-md px-4 py-3 text-sm font-medium hover:bg-gray-200 data-[state=on]:text-white"
                  >
                    {time}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </section>
          {/* Botão Continuar */}
          <div className="fixed right-0 bottom-0 left-0 flex justify-end border-t border-gray-200 bg-white p-3 shadow-2xl drop-shadow-2xl md:sticky md:border-0 md:bg-transparent md:shadow-none md:drop-shadow-none">
            <Button
              className="w-full cursor-pointer md:w-auto"
              size="lg"
              disabled={
                !selectedDoctor ||
                !selectedConsultationType ||
                !selectedTime ||
                !selectedDate
              }
            >
              Prosseguir para o pagamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
