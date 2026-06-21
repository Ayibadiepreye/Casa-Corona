import { Router } from "express";
import * as searchController from "./search.controller";

const router = Router();

router.get("/search/vendors", searchController.searchVendors);
router.get("/search/suggestions", searchController.searchSuggestions);
router.get("/search/trending", searchController.getTrendingVendors);

export default router;