import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = "exemplinho" //aqui da pra pegar do .env()

function validateToken(token: string) {
  try{
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { valid: true, expired: false, decoded}
  } catch (err: any){
    return {
      valid: false,
      expired: err.name === "TokenExpiredError",
      decoded: null
    }
  }
}

export async function GET() {
  try {
    const configurations = await prisma.businessHours.findFirst();
    if(!configurations){
        return NextResponse.json(
            {error: "Não foi encontrada configuração"},
            {status: 404}
        )}
        
    return NextResponse.json(configurations, {status: 200})

  } catch (err){
    console.error(`ERROR in GET/business-hours: ${err}`)
    return NextResponse.json(
      {error: "Internal Error"},
      {status: 404}
    )
  }
}

export async function PUT(request: NextRequest) {
  try{
    const authHeader = request.headers.get("authorization");
    if(!authHeader){
      return NextResponse.json(
        { error: "Token not provided" },
        { status: 401 }
      )
    }

    const jwtToken = authHeader.split(" ")[1];
    const result = validateToken(jwtToken);

    if(!result.valid){
      if(result.expired){
        return NextResponse.json(
        { error: "Expired Token" },
        { status: 401 }
      )
      }
      return NextResponse.json(
        { error: "Invalid Token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updated = await prisma.businessHours.upsert({
      where: {id: body.id || ""},
      update: { ...body },
      create: { ...body}
    });

    return NextResponse.json(updated, { status: 200 });
  }catch (err){
    console.error(`ERROR in PUT/business-hours: ${err}`);
    return NextResponse.json(
      {error: "Internal Error"},
      {status: 500}
    )
  }
}