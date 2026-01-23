
import { useState, useEffect } from 'react';
import { getProfile, getMenuItems } from '../services/db';
import { MenuItem } from '../types';
import { useAppStore } from '../store/AppContext';

export const useGuestData = (uid: string | null, user: any) => {
    const { state } = useAppStore();
    const [guestBusiness, setGuestBusiness] = useState<{ name: string, cuisine: string, logo: string | null } | null>(null);
    const [guestMenu, setGuestMenu] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (uid && uid !== user?.id) {
            setIsLoading(true);
            const fetchData = async () => {
                try {
                    const [profileData, menuData] = await Promise.all([
                        getProfile(uid),
                        getMenuItems(uid)
                    ]);

                    if (profileData) {
                        setGuestBusiness({
                            name: profileData.name,
                            cuisine: profileData.cuisine,
                            logo: profileData.logo_url
                        });
                    }

                    if (menuData) {
                        const mappedItems = menuData.map((m: any) => ({
                            id: m.id,
                            name: m.name,
                            price: m.price,
                            category: m.category,
                            description: m.description,
                            ingredients: m.ingredients,
                            image: m.image_url,
                            sold_out: m.sold_out
                        }));
                        setGuestMenu(mappedItems);
                    }
                } catch (error) {
                    console.error("Error fetching guest data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [uid, user?.id]);

    const business = uid ? (guestBusiness || { name: '', cuisine: '', logo: null }) : state.business;
    const menu = uid ? guestMenu : state.menu;

    return { business, menu, isLoading };
};
