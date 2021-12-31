import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    //Buscar dados do localStorage http://localhost:3000/
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get<Stock>(`/stock/${productId}`);

      const amountStock = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > amountStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }


    /*     try {
          // TODO
    
          const { data: productStock } = await api.get<Stock>(`/stock/${productId}`);
    
          const existProduct = cart.find(product => product.id === productId);
    
          if ((productStock.amount === 0) ||
            ((existProduct) &&
              (existProduct.amount >= productStock.amount))) {
            throw new Error('Quantidade solicitada fora de estoque');
          }
    
          let newCart;
          if (!existProduct) {
            const { data } = await api.get<Omit<Product, 'amount'>>(`/products/${productId}`);
    
            newCart = [...cart,
            {
              ...data,
              amount: 1
            }
            ];
          } else {
    
            newCart = cart.map(product => product.id !== productId ? product : {
              ...product,
              amount: product.amount + 1
            })
          }
    
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    
        } catch (e: any) {
          // TODO
          toast.error(e.message.includes('fora de estoque') ? e.message : 'Erro na adição do produto');
        } */
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }


    /*     try {
    
          const existProduct = cart.find(product => product.id === productId);
    
          if (!existProduct) {
            throw new Error();
          }
    
          const newCart = cart.filter(product => product.id !== productId);
    
          setCart(newCart);
    
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    
        } catch {
          // TODO
          toast.error('Erro na remoção do produto')
        } */
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      if (amount <= 0) {
        return
      }

      const stock = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw new Error();
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }


    /*     try {
          // TODO
          if (amount <= 0) {
            return
          }
    
          const { data: productStock } = await api.get<Stock>(`/stock/${productId}`);
    
          if (productStock.amount < amount) {
            throw new Error('Quantidade solicitada fora de estoque');
          }
    
          const newCart = cart.map(product => product.id !== productId ? product : {
            ...product,
            amount: amount
          });
    
          setCart(newCart);
    
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    
        } catch (err: any) {
          // TODO
          toast.error(err.message.includes('fora de estoque') ? err.message : 'Erro na alteração de quantidade do produto');
        } */
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
