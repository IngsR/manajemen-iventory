"use server";

import { ObjectId } from "mongodb";
import { getItemCollection, ItemDoc } from "@/models/ItemModel";
import { getCategoryCollection } from "@/models/CategoryModel";
import { getUnitCollection } from "@/models/UnitModel";
import { getStockBalanceCollection } from "@/models/StockBalanceModel";
import { getStockMovementCollection } from "@/models/StockMovementModel";
import { updateTag } from "next/cache";
import { StaticTags } from "@/lib/StaticData";
import { ActionResponse } from "./types";
import { requirePermission, requireAuth, isAuthError } from "@/lib/Auth";
import { createAuditLog, auditActor } from "@/services/AuditLogService";
import { serialize } from "@/lib/Utils";

export interface PopulatedItem extends ItemDoc {
  categoryName?: string;
  unitName?: string;
  unitCode?: string;
}

export async function getItemsAction(): Promise<
  ActionResponse<PopulatedItem[]>
> {
  try {
    await requireAuth();
    const itemCollection = await getItemCollection();
    const items = await itemCollection
      .aggregate<PopulatedItem>([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "units",
            localField: "unitId",
            foreignField: "_id",
            as: "unit",
          },
        },
        {
          $addFields: {
            categoryName: { $arrayElemAt: ["$category.name", 0] },
            unitName: { $arrayElemAt: ["$unit.name", 0] },
            unitCode: { $arrayElemAt: ["$unit.code", 0] },
          },
        },
        {
          $project: {
            category: 0,
            unit: 0,
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray();

    return { success: true, data: serialize(items) };
  } catch (err) {
    if (isAuthError(err)) return { success: false, error: err.message };
    console.error("[getItemsAction error]", err);
    return { success: false, error: "Gagal memuat katalog barang." };
  }
}

export async function createItemAction(input: {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitId: string;
  minStock?: number;
}): Promise<ActionResponse<string>> {
  try {
    const user = await requirePermission("ITEM_CREATE");

    const sku = input.sku.trim().toUpperCase();
    const name = input.name.trim();

    if (!sku || !name) {
      return { success: false, error: "SKU dan Nama Barang wajib diisi." };
    }

    if (
      !ObjectId.isValid(input.categoryId) ||
      !ObjectId.isValid(input.unitId)
    ) {
      return { success: false, error: "Kategori atau Satuan tidak valid." };
    }

    const categoryObjId = new ObjectId(input.categoryId);
    const unitObjId = new ObjectId(input.unitId);

    const categoryCollection = await getCategoryCollection();
    const category = await categoryCollection.findOne({
      _id: categoryObjId,
      isDeleted: false,
    });
    if (!category) {
      return {
        success: false,
        error: "Kategori tidak ditemukan atau sudah nonaktif.",
      };
    }

    const unitCollection = await getUnitCollection();
    const unit = await unitCollection.findOne({
      _id: unitObjId,
      isDeleted: false,
    });
    if (!unit) {
      return {
        success: false,
        error: "Satuan tidak ditemukan atau sudah nonaktif.",
      };
    }

    const itemCollection = await getItemCollection();
    const existing = await itemCollection.findOne({ sku, isDeleted: false });
    if (existing) {
      return {
        success: false,
        error: `Barang dengan SKU "${sku}" sudah terdaftar.`,
      };
    }

    const now = new Date();
    const doc: ItemDoc = {
      sku,
      name,
      description: input.description?.trim(),
      categoryId: categoryObjId,
      unitId: unitObjId,
      minStock: Math.max(0, Number(input.minStock) || 0),
      status: "ACTIVE",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await itemCollection.insertOne(doc);

    await createAuditLog({
      ...auditActor(user),
      action: "CREATE",
      resource: "ITEM",
      resourceId: result.insertedId.toHexString(),
      details: {
        sku,
        name,
        categoryId: input.categoryId,
        unitId: input.unitId,
        minStock: doc.minStock,
      },
    });

    updateTag(StaticTags.ITEMS);
    return {
      success: true,
      data: result.insertedId.toHexString(),
      message: "Barang berhasil dibuat.",
    };
  } catch (err) {
    if (isAuthError(err)) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateItemAction(
  id: string,
  input: {
    name: string;
    description?: string;
    categoryId: string;
    unitId: string;
    minStock?: number;
    status: "ACTIVE" | "INACTIVE";
  },
): Promise<ActionResponse> {
  try {
    const user = await requirePermission("ITEM_UPDATE");

    if (!ObjectId.isValid(id)) {
      return { success: false, error: "ID Barang tidak valid." };
    }

    const name = input.name.trim();
    if (!name) {
      return { success: false, error: "Nama Barang tidak boleh kosong." };
    }

    if (
      !ObjectId.isValid(input.categoryId) ||
      !ObjectId.isValid(input.unitId)
    ) {
      return { success: false, error: "Kategori atau Satuan tidak valid." };
    }

    const categoryObjId = new ObjectId(input.categoryId);
    const unitObjId = new ObjectId(input.unitId);

    const categoryCollection = await getCategoryCollection();
    const category = await categoryCollection.findOne({
      _id: categoryObjId,
      isDeleted: false,
    });
    if (!category) {
      return {
        success: false,
        error: "Kategori tidak ditemukan atau sudah nonaktif.",
      };
    }

    const unitCollection = await getUnitCollection();
    const unit = await unitCollection.findOne({
      _id: unitObjId,
      isDeleted: false,
    });
    if (!unit) {
      return {
        success: false,
        error: "Satuan tidak ditemukan atau sudah nonaktif.",
      };
    }

    const itemCollection = await getItemCollection();
    const objId = new ObjectId(id);

    const oldItem = await itemCollection.findOne({
      _id: objId,
      isDeleted: false,
    });
    if (!oldItem) {
      return { success: false, error: "Barang tidak ditemukan." };
    }

    // Catat hanya field yang berubah
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (oldItem.name !== name) {
      before.name = oldItem.name;
      after.name = name;
    }
    if ((oldItem.description || "") !== (input.description?.trim() || "")) {
      before.description = oldItem.description;
      after.description = input.description?.trim();
    }
    if (oldItem.categoryId.toHexString() !== input.categoryId) {
      before.categoryId = oldItem.categoryId.toHexString();
      after.categoryId = input.categoryId;
    }
    if (oldItem.unitId.toHexString() !== input.unitId) {
      before.unitId = oldItem.unitId.toHexString();
      after.unitId = input.unitId;
    }
    const newMinStock = Math.max(0, Number(input.minStock) || 0);
    if (oldItem.minStock !== newMinStock) {
      before.minStock = oldItem.minStock;
      after.minStock = newMinStock;
    }
    if (oldItem.status !== input.status) {
      before.status = oldItem.status;
      after.status = input.status;
    }

    await itemCollection.updateOne(
      { _id: objId, isDeleted: false },
      {
        $set: {
          name,
          description: input.description?.trim(),
          categoryId: categoryObjId,
          unitId: unitObjId,
          minStock: newMinStock,
          status: input.status,
          updatedAt: new Date(),
        },
      },
    );

    await createAuditLog({
      ...auditActor(user),
      action: "UPDATE",
      resource: "ITEM",
      resourceId: id,
      details: { before, after },
    });

    updateTag(StaticTags.ITEMS);
    return { success: true, message: "Barang berhasil diperbarui." };
  } catch (err) {
    if (isAuthError(err)) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteItemAction(id: string): Promise<ActionResponse> {
  try {
    const user = await requirePermission("ITEM_UPDATE");

    if (!ObjectId.isValid(id)) {
      return { success: false, error: "ID Barang tidak valid." };
    }

    const objId = new ObjectId(id);
    const stockBalanceCollection = await getStockBalanceCollection();
    const stockMovementCollection = await getStockMovementCollection();

    // 1. Cek apakah item masih punya sisa stok fisik > 0
    const stock = await stockBalanceCollection.findOne({
      itemId: objId,
      quantity: { $gt: 0 },
    });

    if (stock) {
      return {
        success: false,
        error: `Tidak dapat menghapus barang: masih memiliki sisa stok (${stock.quantity} unit) di gudang.`,
      };
    }

    // 2. Cek apakah item punya riwayat mutasi stok
    const movement = await stockMovementCollection.findOne({ itemId: objId });
    if (movement) {
      // Master data dengan ledger transaksi historis tidak boleh dihapus — nonaktifkan saja
      const itemCollection = await getItemCollection();
      await itemCollection.updateOne(
        { _id: objId },
        { $set: { status: "INACTIVE", updatedAt: new Date() } },
      );

      await createAuditLog({
        ...auditActor(user),
        action: "UPDATE",
        resource: "ITEM",
        resourceId: id,
        details: { statusChange: "INACTIVE (historical transactions exist)" },
      });

      updateTag(StaticTags.ITEMS);
      return {
        success: true,
        message:
          "Barang memiliki riwayat transaksi mutasi. Barang berhasil dinonaktifkan (INACTIVE) demi integritas audit.",
      };
    }

    // 3. Tidak ada stok & tidak ada mutasi → aman untuk soft delete
    const itemCollection = await getItemCollection();
    const result = await itemCollection.updateOne(
      { _id: objId, isDeleted: false },
      { $set: { isDeleted: true, status: "INACTIVE", updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Barang tidak ditemukan." };
    }

    await createAuditLog({
      ...auditActor(user),
      action: "DELETE",
      resource: "ITEM",
      resourceId: id,
    });

    updateTag(StaticTags.ITEMS);
    return {
      success: true,
      message: "Barang berhasil dihapus / dinonaktifkan.",
    };
  } catch (err) {
    if (isAuthError(err)) {
      return { success: false, error: err.message };
    }
    console.error("[deleteItemAction error]", err);
    return {
      success: false,
      error: "Gagal menghapus barang. Terjadi kesalahan pada sistem.",
    };
  }
}
