"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2
} from "lucide-react";

import { tablecrmGet, tablecrmPost } from "@/lib/api";
import {
  getEntityId,
  getEntityName,
  getProductPrice,
  normalizeArray
} from "@/lib/normalize";
import { buildSalePayload } from "@/lib/payload";
import { formatMoney } from "@/lib/utils";

import type {
  CartItem,
  Client,
  Dictionaries,
  ID,
  Organization,
  Paybox,
  PriceType,
  Product,
  SaleMode,
  Warehouse
} from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const emptyDictionaries: Dictionaries = {
  organizations: [],
  warehouses: [],
  payboxes: [],
  priceTypes: [],
  products: []
};

type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: SelectFieldOption[];
  disabled?: boolean;
};

function SelectField({
  value,
  onValueChange,
  placeholder,
  options,
  disabled
}: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-11 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {options
          .filter((option) => option.value)
          .map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

function toOption(entity: {
  id?: ID;
  uuid?: ID;
  guid?: ID;
  name?: string;
  title?: string;
  label?: string;
}): SelectFieldOption {
  const id = getEntityId(entity);

  return {
    value: id === null ? "" : String(id),
    label: getEntityName(entity)
  };
}

function findById<T extends { id?: ID; uuid?: ID; guid?: ID }>(
  items: T[],
  id: string
): T | null {
  if (!id) {
    return null;
  }

  return (
    items.find((item) => {
      const entityId = getEntityId(item);

      return entityId !== null && String(entityId) === id;
    }) ?? null
  );
}

export function MobileOrderApp() {
  const [token, setToken] = useState("");

  const [phone, setPhone] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [dictionaries, setDictionaries] =
    useState<Dictionaries>(emptyDictionaries);

  const [organizationId, setOrganizationId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [payboxId, setPayboxId] = useState("");
  const [priceTypeId, setPriceTypeId] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [comment, setComment] = useState("");

  const [isLoadingDictionaries, setIsLoadingDictionaries] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedClient = useMemo(() => {
    return findById<Client>(clients, selectedClientId);
  }, [clients, selectedClientId]);

  const selectedOrganization = useMemo(() => {
    return findById<Organization>(dictionaries.organizations, organizationId);
  }, [dictionaries.organizations, organizationId]);

  const selectedWarehouse = useMemo(() => {
    return findById<Warehouse>(dictionaries.warehouses, warehouseId);
  }, [dictionaries.warehouses, warehouseId]);

  const selectedPaybox = useMemo(() => {
    return findById<Paybox>(dictionaries.payboxes, payboxId);
  }, [dictionaries.payboxes, payboxId]);

  const selectedPriceType = useMemo(() => {
    return findById<PriceType>(dictionaries.priceTypes, priceTypeId);
  }, [dictionaries.priceTypes, priceTypeId]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    if (!search) {
      return dictionaries.products.slice(0, 30);
    }

    return dictionaries.products
      .filter((product) => {
        return getEntityName(product).toLowerCase().includes(search);
      })
      .slice(0, 30);
  }, [dictionaries.products, productSearch]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }, [cart]);

  async function loadDictionaries() {
    if (!token.trim()) {
      setError("Введите token");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoadingDictionaries(true);

    try {
        const [
            organizationsResponse,
            warehousesResponse,
            payboxesResponse,
            priceTypesResponse,
            productsResponse
            ] = await Promise.all([
            tablecrmGet<unknown>("organizations/", { token }),
            tablecrmGet<unknown>("warehouses/", { token }),
            tablecrmGet<unknown>("payboxes/", { token }),
            tablecrmGet<unknown>("price_types/", { token }),
            tablecrmGet<unknown>("nomenclature/", { token })
        ]);

      const nextDictionaries: Dictionaries = {
        organizations: normalizeArray<Organization>(organizationsResponse),
        warehouses: normalizeArray<Warehouse>(warehousesResponse),
        payboxes: normalizeArray<Paybox>(payboxesResponse),
        priceTypes: normalizeArray<PriceType>(priceTypesResponse),
        products: normalizeArray<Product>(productsResponse)
      };

      setDictionaries(nextDictionaries);

      setOrganizationId(
        nextDictionaries.organizations[0]
          ? String(getEntityId(nextDictionaries.organizations[0]) ?? "")
          : ""
      );

      setWarehouseId(
        nextDictionaries.warehouses[0]
          ? String(getEntityId(nextDictionaries.warehouses[0]) ?? "")
          : ""
      );

      setPayboxId(
        nextDictionaries.payboxes[0]
          ? String(getEntityId(nextDictionaries.payboxes[0]) ?? "")
          : ""
      );

      setPriceTypeId(
        nextDictionaries.priceTypes[0]
          ? String(getEntityId(nextDictionaries.priceTypes[0]) ?? "")
          : ""
      );

      setSuccessMessage("Справочники загружены");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось загрузить справочники"
      );
    } finally {
      setIsLoadingDictionaries(false);
    }
  }

  async function searchClient() {
    if (!token.trim()) {
      setError("Введите token");
      return;
    }

    if (!phone.trim()) {
      setError("Введите телефон клиента");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSearchingClient(true);

    try {
        const response = await tablecrmGet<unknown>("contragents/", {
            token,
            phone: phone.trim(),
            search: phone.trim()
        });

      const foundClients = normalizeArray<Client>(response);

      setClients(foundClients);

      if (foundClients[0]) {
        setSelectedClientId(String(getEntityId(foundClients[0]) ?? ""));
      } else {
        setSelectedClientId("");
      }

      setSuccessMessage(
        foundClients.length
          ? `Найдено клиентов: ${foundClients.length}`
          : "Клиент не найден"
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось найти клиента"
      );
    } finally {
      setIsSearchingClient(false);
    }
  }

  function addProduct(product: Product) {
    const productId = getEntityId(product);

    if (productId === null) {
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => {
        const id = getEntityId(item.product);

        return id !== null && String(id) === String(productId);
      });

      if (existingItem) {
        return currentCart.map((item) => {
          const id = getEntityId(item.product);

          if (id !== null && String(id) === String(productId)) {
            return {
              ...item,
              quantity: item.quantity + 1
            };
          }

          return item;
        });
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
          price: getProductPrice(product)
        }
      ];
    });
  }

  function updateCartQuantity(product: Product, quantity: number) {
    const productId = getEntityId(product);

    if (productId === null) {
      return;
    }

    if (quantity <= 0 || Number.isNaN(quantity)) {
      removeProduct(product);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        const id = getEntityId(item.product);

        if (id !== null && String(id) === String(productId)) {
          return {
            ...item,
            quantity
          };
        }

        return item;
      })
    );
  }

  function updateCartPrice(product: Product, price: number) {
    const productId = getEntityId(product);

    if (productId === null) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        const id = getEntityId(item.product);

        if (id !== null && String(id) === String(productId)) {
          return {
            ...item,
            price: Number.isNaN(price) ? 0 : price
          };
        }

        return item;
      })
    );
  }

  function removeProduct(product: Product) {
    const productId = getEntityId(product);

    if (productId === null) {
      return;
    }

    setCart((currentCart) =>
      currentCart.filter((item) => {
        const id = getEntityId(item.product);

        return id === null || String(id) !== String(productId);
      })
    );
  }

  async function submitSale(mode: SaleMode) {
    if (!token.trim()) {
      setError("Введите token");
      return;
    }

    if (!selectedClient) {
      setError("Выберите клиента");
      return;
    }

    if (!selectedOrganization) {
      setError("Выберите организацию");
      return;
    }

    if (!selectedWarehouse) {
      setError("Выберите склад");
      return;
    }

    if (!selectedPaybox) {
      setError("Выберите счёт");
      return;
    }

    if (!selectedPriceType) {
      setError("Выберите тип цены");
      return;
    }

    if (!cart.length) {
      setError("Добавьте хотя бы один товар");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload = buildSalePayload({
        mode,
        client: selectedClient,
        organization: selectedOrganization,
        warehouse: selectedWarehouse,
        paybox: selectedPaybox,
        priceType: selectedPriceType,
        cart,
        comment
      });

      await tablecrmPost<unknown>("docs_sales/", { token }, payload);

      setSuccessMessage(
        mode === "conduct"
          ? "Продажа создана и проведена"
          : "Продажа создана"
      );

      setCart([]);
      setComment("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось создать продажу"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 px-4 py-4">
      <div className="mb-5">
        <Badge className="mb-3 bg-white">TableCRM webapp</Badge>

        <h1 className="text-2xl font-bold tracking-tight">
          Создание заказа
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Мобильная форма оформления продажи
        </p>
      </div>

      <div className="space-y-4 pb-28">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>1. Авторизация</CardTitle>
            <CardDescription>
              Вставьте token кассы из TableCRM
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="введите токен кассы"
              />
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={loadDictionaries}
              disabled={isLoadingDictionaries}
            >
              {isLoadingDictionaries ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Загрузить справочники
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Клиент</CardTitle>
            <CardDescription>
              Поиск клиента по номеру телефона
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 999 000-00-00"
                inputMode="tel"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={searchClient}
              disabled={isSearchingClient}
            >
              {isSearchingClient ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Найти клиента
            </Button>

            <SelectField
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              placeholder="Выберите клиента"
              options={clients.map(toOption)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Параметры продажи</CardTitle>
            <CardDescription>
              Счёт, организация, склад и тип цены
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Счёт</Label>
              <SelectField
                value={payboxId}
                onValueChange={setPayboxId}
                placeholder="Выберите счёт"
                options={dictionaries.payboxes.map(toOption)}
              />
            </div>

            <div className="space-y-2">
              <Label>Организация</Label>
              <SelectField
                value={organizationId}
                onValueChange={setOrganizationId}
                placeholder="Выберите организацию"
                options={dictionaries.organizations.map(toOption)}
              />
            </div>

            <div className="space-y-2">
              <Label>Склад</Label>
              <SelectField
                value={warehouseId}
                onValueChange={setWarehouseId}
                placeholder="Выберите склад"
                options={dictionaries.warehouses.map(toOption)}
              />
            </div>

            <div className="space-y-2">
              <Label>Тип цены</Label>
              <SelectField
                value={priceTypeId}
                onValueChange={setPriceTypeId}
                placeholder="Выберите тип цены"
                options={dictionaries.priceTypes.map(toOption)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Товары</CardTitle>
            <CardDescription>
              Поиск и добавление товаров в заказ
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Поиск товара"
            />

            <div className="space-y-2">
              {filteredProducts.length ? (
                filteredProducts.map((product) => {
                  const id = getEntityId(product);

                  return (
                    <div
                      key={String(id)}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {getEntityName(product)}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {formatMoney(getProductPrice(product))}
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addProduct(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed bg-white p-4 text-center text-sm text-muted-foreground">
                  Товары не найдены
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Корзина</CardTitle>
            <CardDescription>
              Проверьте количество и цены
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {cart.length ? (
              cart.map((item) => {
                const productId = getEntityId(item.product);

                return (
                  <div
                    key={String(productId)}
                    className="space-y-3 rounded-xl border bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {getEntityName(item.product)}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Сумма: {formatMoney(item.price * item.quantity)}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(item.product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Кол-во</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateCartQuantity(
                              item.product,
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Цена</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.price}
                          onChange={(event) =>
                            updateCartPrice(
                              item.product,
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed bg-white p-4 text-center text-sm text-muted-foreground">
                Корзина пустая
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Итого</span>
              <span className="text-lg font-bold">
                {formatMoney(total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Комментарий</CardTitle>
          </CardHeader>

          <CardContent>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Комментарий к продаже"
            />
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => submitSale("create")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Создать
          </Button>

          <Button
            type="button"
            onClick={() => submitSale("conduct")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Создать и провести
          </Button>
        </div>
      </div>
    </main>
  );
}