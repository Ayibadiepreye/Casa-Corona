
import { Response, NextFunction } from "express";
import * as adminService from "./admin.service.js";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import { ok, created } from "../../lib/response.js";

export const getPlatformStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getPlatformStats();
    ok(res, stats);
  } catch (e) {
    next(e);
  }
};

export const listAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      role: req.query.role as string | undefined,
      suspended: req.query.suspended !== undefined ? req.query.suspended === "true" : undefined,
      q: req.query.q as string | undefined,
    };
    const result = await adminService.listAllUsers(query);
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const getUserDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.getUserDetail(req.params.id as string);
    ok(res, user);
  } catch (e) {
    next(e);
  }
};

export const suspendUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const user = await adminService.suspendUser(req.params.id as string, reason, req.user!.userId);
    ok(res, { user });
  } catch (e) {
    next(e);
  }
};

export const unsuspendUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.unsuspendUser(req.params.id as string, req.user!.userId);
    ok(res, { user });
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteUser(req.params.id as string, req.user!.userId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const impersonateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.impersonateUser(req.user!.userId, req.params.id as string);
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const listAllVendors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      status: req.query.status as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      verified: req.query.verified !== undefined ? req.query.verified === "true" : undefined,
      featured: req.query.featured !== undefined ? req.query.featured === "true" : undefined,
      q: req.query.q as string | undefined,
    };
    const result = await adminService.listAllVendors(query);
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const listPendingVendors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.listPendingVendors();
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const bulkApproveVendors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vendorIds } = req.body;
    const result = await adminService.bulkApproveVendors(vendorIds, req.user!.userId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const updateVendor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vendor = await adminService.updateVendor(req.params.id as string, req.body, req.user!.userId);
    ok(res, vendor);
  } catch (e) {
    next(e);
  }
};

export const suspendVendor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const vendor = await adminService.suspendVendor(req.params.id as string, reason, req.user!.userId);
    ok(res, { vendor });
  } catch (e) {
    next(e);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = await adminService.createCategory(req.body, req.user!.userId);
    created(res, { category });
  } catch (e) {
    next(e);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = await adminService.updateCategory(req.params.id as string, req.body, req.user!.userId);
    ok(res, { category });
  } catch (e) {
    next(e);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = await adminService.deleteCategory(req.params.id as string, req.user!.userId);
    ok(res, { category });
  } catch (e) {
    next(e);
  }
};

export const listAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcements = await adminService.listAnnouncements();
    ok(res, { announcements });
  } catch (e) {
    next(e);
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcement = await adminService.createAnnouncement(req.body, req.user!.userId);
    created(res, { announcement });
  } catch (e) {
    next(e);
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcement = await adminService.updateAnnouncement(req.params.id as string, req.body, req.user!.userId);
    ok(res, { announcement });
  } catch (e) {
    next(e);
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteAnnouncement(req.params.id as string, req.user!.userId);
    ok(res);
  } catch (e) {
    next(e);
  }
};

export const listFaqs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const faqs = await adminService.listFaqs();
    ok(res, { faqs });
  } catch (e) {
    next(e);
  }
};

export const createFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const faq = await adminService.createFaq(req.body, req.user!.userId);
    created(res, { faq });
  } catch (e) {
    next(e);
  }
};

export const updateFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const faq = await adminService.updateFaq(req.params.id as string, req.body, req.user!.userId);
    ok(res, { faq });
  } catch (e) {
    next(e);
  }
};

export const deleteFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteFaq(req.params.id as string, req.user!.userId);
    ok(res);
  } catch (e) {
    next(e);
  }
};

export const listAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      actorId: req.query.actorId as string,
      resourceType: req.query.resourceType as string,
    };
    const result = await adminService.listAuditLogs(query);
    ok(res, result);
  } catch (e) {
    next(e);
  }
};

export const getSystemHealth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const health = await adminService.getSystemHealth();
    ok(res, health);
  } catch (e) {
    next(e);
  }
};

export const exportDataAsCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const csv = await adminService.exportDataAsCsv(req.params.table as string);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.table}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
};
