'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

const initialTypes = [
    { label: 'General', value: 'General' },
    { label: 'Preventive Maintenance', value: 'Preventive Maintenance' },
    { label: 'AMC', value: 'AMC' },
    { label: 'Scheduled', value: 'Scheduled' },
    { label: 'Others', value: 'Others' },
];

export function useMaintenanceTypes() {
    const [dbTypes, setDbTypes] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchTypes = async () => {
            const { data, error } = await supabase.from('maintenanceTypes').select('id, name');
            if (error) {
                console.error('Error fetching maintenance types:', error);
            } else {
                setDbTypes(data || []);
            }
            setIsLoading(false);
        };

        fetchTypes();
    }, []);

    const maintenanceTypes = useMemo(() => {
        const allTypes = [...initialTypes];
        if (dbTypes) {
            dbTypes.forEach(dbType => {
                if (!allTypes.some(t => t.value.toLowerCase() === dbType.name.toLowerCase())) {
                    allTypes.push({ label: dbType.name, value: dbType.name });
                }
            });
        }
        return allTypes;
    }, [dbTypes]);

    const addMaintenanceType = async (typeName: string) => {
        if (!typeName) return;

        const typeExists = maintenanceTypes.some(t => t.value.toLowerCase() === typeName.toLowerCase());
        if (typeExists) return;

        const { data, error } = await supabase.from('maintenanceTypes').insert({ name: typeName, user_id: user?.id }).select('id, name').single();
        if (error) {
            console.error('Error adding maintenance type:', error);
        } else {
            if (data) {
                setDbTypes(prev => [...prev, data]);
            }
        }
    };

    const updateMaintenanceType = async (id: string, newName: string) => {
        const { error, data } = await supabase.from('maintenanceTypes').update({ name: newName }).eq('id', id).select('id, name').single();
        if (error) {
            console.error('Error updating maintenance type:', error);
            return false;
        }
        setDbTypes(prev => prev.map(t => (t.id === id ? { id, name: newName } : t)));
        return true;
    };

    const deleteMaintenanceType = async (id: string) => {
        const { error } = await supabase.from('maintenanceTypes').delete().eq('id', id);
        if (error) {
            console.error('Error deleting maintenance type:', error);
            return false;
        }
        setDbTypes(prev => prev.filter(t => t.id !== id));
        return true;
    };

    return { maintenanceTypes, addMaintenanceType, updateMaintenanceType, deleteMaintenanceType, dbTypes, isLoading };
}
