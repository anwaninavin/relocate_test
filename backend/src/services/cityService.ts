import { connectDB } from "@/db";
import { City } from "@/models/City";
import type { CityInput, CityUpdateInput } from "@/validations/admin";

export async function listCities(search?: string) {
  await connectDB();
  const filter = search ? { name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {};
  return City.find(filter).sort({ featured: -1, name: 1 }).lean();
}

export async function createCity(input: CityInput) {
  await connectDB();
  return City.create(input);
}

export async function updateCity(input: CityUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return City.findByIdAndUpdate(id, rest, { returnDocument: "after" }).lean();
}

export async function deleteCity(id: string) {
  await connectDB();
  return City.deleteOne({ _id: id });
}
