import { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/AppError.js";
import { validate } from "../../lib/validate.js";
import { propertyQuerySchema, vehicleQuerySchema } from "./browse.schema.js";
import { searchProperties, searchVehicles, getListingDetail, getContactInfo, recordInquiry } from "./browse.service.js";



export async function properties(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('Properties query:', req.query);
        const result = validate(propertyQuerySchema, req.query);
        const data = await searchProperties(result);
        console.log('Properties result count:', data.items?.length || 0);
        return res.json(data);
    } catch (error) {
        console.error('Properties error:', error);
        next(error);
        return;
    }
}

export async function vehicles(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('Vehicles query:', req.query);
        const result = validate(vehicleQuerySchema, req.query);
        const data = await searchVehicles(result);
        console.log('Vehicles result count:', data.items?.length || 0);
        return res.json(data);
    } catch (error) {
        console.error('Vehicles error:', error);
        next(error);
        return;
    }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
    try {
        return res.json(await getListingDetail(String(req.params.id)));
    } catch (error) {
        next(error);
        return;
    }
}

export async function contact(req: Request, res: Response, next: NextFunction) {
    try {
        return res.json(await getContactInfo(String(req.params.id)));
    } catch (error) {
        next(error);
        return;
    }
}

export async function inquiry(req: Request, res: Response, next: NextFunction) {
    try {
        await recordInquiry(String(req.params.id));
        return res.json({ message: "Inquiry recorded" });
    } catch (error) {
        next(error);
        return;
    }
}