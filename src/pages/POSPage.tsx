import React, { useState, useRef, useEffect } from 'react';
import { Package, BarChart3, Receipt, Calculator, CreditCard, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useSubscription } from '@/hooks/useSubscription';
import { usePOSStats } from '@/hooks/usePOS';
import { useInventoryProducts } from '@/hooks/useInventory';
import { formatCurrencyWithCode } from '@/utils/currencyConverter';
import POSTerminal from '@/components/pos/POSTerminal';
import POSPurchaseOrders from '@/components/pos/POSPurchaseOrders';
import InventoryDashboard from '@/components/inventory/InventoryDashboard';
import POSSalesHistory from '@/components/pos/POSSalesHistory';
import POSAnalytics from '@/components/pos/POSAnalytics';
import POSSettingsModal from '@/components/pos/POSSettingsModal';
import { usePOSSettings } from '@/hooks/usePOSSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const POSPage = () => {
  const { subscribed, loading: subLoading } = useSubscription();
  const { data: todayStats } = usePOSStats();
  const { data: products } = useInventoryProducts();
  const { settings: posSettings, loading: posLoading, setTillOpen } = usePOSSettings();
  const [openSettings, setOpenSettings] = useState(false);
  const { settings: appSettings } = useUserSettings();

  // POS UI state
  const [activeTab, setActiveTab] = useState<string>('terminal');
  const containerRef = useRef<HTMLElement | null>(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const handler = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Initial loader while checking subscription and POS settings
  if (subLoading || posLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  // Gating for paid access
  if (!subscribed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>POS & Inventory Management</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              POS and Inventory Management is only available for paid subscribers.
            </p>
            <Button onClick={() => window.location.href = '/subscription'}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  if (appSettings?.pos_enabled !== true) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>POS & Inventory Disabled</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Enable POS in Settings to access the POS terminal and inventory.
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currencyCode = posSettings?.currency || 'USD';
  const isTillOpen = posSettings?.tillOpen ?? false;
  const lowStockCount = products?.filter(p => p.quantity_in_stock <= p.minimum_stock_level).length || 0;

  return (
    <main className="space-y-6">
      {/* Header */}
{activeTab !== 'terminal' && !isFull && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">POS & Inventory</h1>
            <p className="text-muted-foreground">Manage your point of sale and inventory operations</p>
          </div>
          <div>
            <Button variant="outline" onClick={() => setOpenSettings(true)}>POS Settings</Button>
          </div>
        </div>
      )}

      {/* Today's Stats */}
{activeTab !== 'terminal' && !isFull && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 max-h-[20vh]">
          <Card>
            <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Today's Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-semibold leading-tight">
                {formatCurrencyWithCode(todayStats?.totalSales || 0, currencyCode)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {todayStats?.salesCount || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Average Ticket</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-semibold leading-tight">
                {formatCurrencyWithCode(todayStats?.averageTicket || 0, currencyCode)}
              </div>
              <p className="text-[11px] text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-semibold leading-tight">{products?.length || 0}</div>
              <p className="text-[11px] text-muted-foreground">Active products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium">Low Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-semibold leading-tight text-destructive">{lowStockCount}</div>
              <p className="text-[11px] text-muted-foreground">Items need restock</p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Main Content Tabs to reduce scrolling */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            {!isFull && (
              <TabsList>
                <TabsTrigger value="terminal">Terminal</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="purchases">Purchase Orders</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            )}

          <TabsContent value="terminal">
            <section aria-labelledby="pos-terminal-heading" ref={containerRef}>
              <div className="flex items-center justify-between">
                <h2 id="pos-terminal-heading" className="text-xl font-semibold">POS Terminal</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => {
                    if (!document.fullscreenElement) {
                      containerRef.current?.requestFullscreen?.();
                    } else {
                      document.exitFullscreen?.();
                    }
                  }}>
                    {isFull ? (
                      <><Minimize2 className="h-4 w-4 mr-2" /> Exit Fullscreen</>
                    ) : (
                      <><Maximize2 className="h-4 w-4 mr-2" /> Fullscreen</>
                    )}
                  </Button>
                  <Button variant="secondary" onClick={() => setOpenSettings(true)}>POS Settings</Button>
                </div>
              </div>
              <div className="mt-4">
                {isTillOpen ? (
                  <POSTerminal currency={currencyCode} />
                ) : (
                  <Card className="p-6">
                    <h3 className="text-lg font-medium">Till is closed</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Open the till to start processing sales in the POS terminal.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={async () => { await setTillOpen(true); }} className="min-w-[140px]">
                        Open Till
                      </Button>
                      <Button variant="outline" onClick={() => setOpenSettings(true)}>
                        POS Settings
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="inventory">
            <section aria-labelledby="inventory-heading">
              <h2 id="inventory-heading" className="text-xl font-semibold">Inventory</h2>
              <div className="mt-4">
                <InventoryDashboard />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="purchases">
            <section aria-labelledby="purchases-heading">
              <h2 id="purchases-heading" className="text-xl font-semibold">Purchase Orders</h2>
              <div className="mt-4">
                <POSPurchaseOrders currency={currencyCode} />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="sales">
            <section aria-labelledby="sales-heading">
              <h2 id="sales-heading" className="text-xl font-semibold">Sales History</h2>
              <div className="mt-4">
                <POSSalesHistory />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="analytics">
            <section aria-labelledby="analytics-heading">
              <h2 id="analytics-heading" className="text-xl font-semibold">Analytics</h2>
              <div className="mt-4">
                <POSAnalytics currency={currencyCode} />
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Modal */}
      <POSSettingsModal open={openSettings} onOpenChange={setOpenSettings} />
    </main>
  );
};

export default POSPage;