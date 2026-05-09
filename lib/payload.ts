import type {
    CartItem,
    ID,
    Paybox,
    PriceType,
    SaleMode,
    Warehouse,
    Organization,
    Client
  } from "@/lib/types";
  import { getEntityId } from "@/lib/normalize";
  
  type BuildSalePayloadParams = {
    mode: SaleMode;
    client: Client | null;
    organization: Organization | null;
    warehouse: Warehouse | null;
    paybox: Paybox | null;
    priceType: PriceType | null;
    cart: CartItem[];
    comment: string;
  };
  
  function requiredId(entity: { id?: ID; uuid?: ID; guid?: ID } | null) {
    return entity ? getEntityId(entity) : null;
  }
  
  export function buildSalePayload(params: BuildSalePayloadParams) {
    const {
      mode,
      client,
      organization,
      warehouse,
      paybox,
      priceType,
      cart,
      comment
    } = params;
  
    const products = cart.map((item) => {
      const productId = requiredId(item.product);
  
      return {
        nomenclature: productId,
        nomenclature_id: productId,
        product: productId,
        quantity: item.quantity,
        count: item.quantity,
        price: item.price,
        sum: item.price * item.quantity
      };
    });
  
    const totalSum = products.reduce((sum, item) => {
      return sum + item.sum;
    }, 0);
  
    return {
      contragent: requiredId(client),
      contragent_id: requiredId(client),
  
      organization: requiredId(organization),
      organization_id: requiredId(organization),
  
      warehouse: requiredId(warehouse),
      warehouse_id: requiredId(warehouse),
  
      paybox: requiredId(paybox),
      paybox_id: requiredId(paybox),
  
      price_type: requiredId(priceType),
      price_type_id: requiredId(priceType),
  
      comment,
  
      products,
      items: products,
  
      total_sum: totalSum,
      total: totalSum,
  
      conducted: mode === "conduct",
      is_conducted: mode === "conduct"
    };
  }