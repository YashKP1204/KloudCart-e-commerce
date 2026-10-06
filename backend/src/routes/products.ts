import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';

export const productsRouter = Router();

// GET /api/products - list all products with optional filters
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const products = await dbManager.getProducts(
      typeof category === 'string' ? category : undefined,
      typeof search === 'string' ? search : undefined
    );
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch products'
    });
  }
});

// GET /api/products/:id - single product detail
productsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await dbManager.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with ID '${id}' not found`
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch product'
    });
  }
});
