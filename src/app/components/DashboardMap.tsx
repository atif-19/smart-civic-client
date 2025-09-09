    "use client";

    import { useEffect, useRef, useState, useCallback } from "react";

    // Type definitions for leaflet.heat
    interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    minOpacity?: number;
    }

    // Extended Leaflet types
    interface ExtendedHeatLayer {
    setLatLngs(latlngs: Array<[number, number] | [number, number, number]>): this;
    addTo(map: ExtendedMap): this;
    remove(): this;
    _canvas?: HTMLCanvasElement;
    _map?: ExtendedMap;
    }

    interface ExtendedMap {
    addLayer(layer: ExtendedHeatLayer | ExtendedLayerGroup): this;
    removeLayer(layer: ExtendedHeatLayer | ExtendedLayerGroup): this;
    hasLayer(layer: ExtendedHeatLayer | ExtendedLayerGroup): boolean;
    remove(): void;
    invalidateSize(): void;
    whenReady(callback: () => void): void;
    on(type: string, fn: () => void): this;
    scrollWheelZoom: {
        disable(): void;
        enable(): void;
    };
    _customIcon?: ExtendedDivIcon;
    }

    interface ExtendedLayerGroup {
    addTo(map: ExtendedMap): this;
    clearLayers(): void;
    addLayer(layer: ExtendedMarker): void;
    }

    interface ExtendedMarker {
    bindPopup(
        content: string,
        options?: { maxWidth?: number; className?: string }
    ): this;
    }

    interface ExtendedDivIcon {
    options: {
        html: string;
        className: string;
        iconSize: [number, number];
        iconAnchor: [number, number];
        popupAnchor: [number, number];
    };
    }

    interface ExtendedTileLayer {
    addTo(map: ExtendedMap): this;
    }

    interface LeafletStatic {
    map(element: HTMLElement, options?: Record<string, unknown>): ExtendedMap;
    tileLayer(
        urlTemplate: string,
        options?: Record<string, unknown>
    ): ExtendedTileLayer;
    layerGroup(): ExtendedLayerGroup;
    marker(
        latlng: [number, number],
        options?: { icon?: ExtendedDivIcon }
    ): ExtendedMarker;
    divIcon(options: {
        html: string;
        className: string;
        iconSize: [number, number];
        iconAnchor: [number, number];
        popupAnchor: [number, number];
    }): ExtendedDivIcon;
    heatLayer(
        latlngs: Array<[number, number] | [number, number, number]>,
        options?: HeatLayerOptions
    ): ExtendedHeatLayer;
    Icon: {
        Default: {
        prototype: Record<string, unknown>;
        mergeOptions(options: Record<string, string>): void;
        };
    };
    }

    interface Report {
    _id: string;
    category: string;
    description: string;
    imageUrl: string;
    location: { lat: number; lng: number };
    upvoteCount: number;
    }

    interface MapProps {
    reports: Report[];
    }

    const DashboardMap = ({ reports }: MapProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<ExtendedMap | null>(null);
    const heatLayerRef = useRef<ExtendedHeatLayer | null>(null);
    const markerLayerRef = useRef<ExtendedLayerGroup | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Safe heatmap update function
    const safeUpdateHeatmap = useCallback(
        (points: [number, number, number][]) => {
        if (!heatLayerRef.current || !mapInstanceRef.current) return;

        try {
            const container = mapContainerRef.current;
            if (
            !container ||
            container.offsetWidth <= 0 ||
            container.offsetHeight <= 0
            ) {
            return;
            }

            // Check if the heatmap layer is added to the map
            const heatLayer = heatLayerRef.current;
            const map = mapInstanceRef.current;
            if (map && heatLayer && !map.hasLayer(heatLayer)) {
            return;
            }

            // Only update if we have valid points
            if (points.length > 0) {
            heatLayerRef.current.setLatLngs(points);
            } else {
            heatLayerRef.current.setLatLngs([]);
            }
        } catch (error) {
            console.error("Error updating heatmap safely:", error);
        }
        },
        []
    );

    // Initialize map only on client side
    useEffect(() => {
        if (!isClient || !mapContainerRef.current || mapInstanceRef.current) {
        return;
        }

        const initializeMap = async () => {
        try {
            // Dynamic import of Leaflet to ensure it's loaded on client side only
            const leafletModule = await import("leaflet");
            const LeafletLib = leafletModule.default as unknown as LeafletStatic;
            // Import leaflet.heat plugin
            await import("leaflet.heat");

            // Fix for default markers in Next.js
            delete LeafletLib.Icon.Default.prototype._getIconUrl;
            LeafletLib.Icon.Default.mergeOptions({
            iconRetinaUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });

            // Create custom marker icon
            const customMarkerIcon = LeafletLib.divIcon({
            html: `<div class="custom-marker-container">
                <div class="custom-marker-pin"></div>
                <div class="custom-marker-dot"></div>
            </div>`,
            className: "",
            iconSize: [24, 32],
            iconAnchor: [12, 32],
            popupAnchor: [0, -32],
            });

            // Wait for container to have proper dimensions
            const initWithProperDimensions = () => {
            const container = mapContainerRef.current;
            if (
                !container ||
                container.offsetWidth <= 0 ||
                container.offsetHeight <= 0
            ) {
                setTimeout(initWithProperDimensions, 100);
                return;
            }

            try {
                // Initialize map with mobile-friendly options
                const isMobile = window.innerWidth < 768;
                const map = LeafletLib.map(container, {
                center: [23.0225, 72.5714],
                zoom: isMobile ? 11 : 12,
                zoomControl: true,
                scrollWheelZoom: !isMobile,
                touchZoom: true,
                tap: true,
                maxZoom: 18,
                minZoom: 8,
                preferCanvas: true,
                });

                // Add tile layer
                LeafletLib.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    attribution: "&copy; OpenStreetMap contributors",
                    maxZoom: 18,
                }
                ).addTo(map);

                mapInstanceRef.current = map;

                // Initialize marker layer first
                markerLayerRef.current = LeafletLib.layerGroup().addTo(map);

                // Store custom icon for later use
                map._customIcon = customMarkerIcon;

                // Add mobile-specific event handlers
                if (isMobile) {
                map.on("touchstart", () => {
                    map.scrollWheelZoom.disable();
                });

                map.on("touchend", () => {
                    setTimeout(() => map.scrollWheelZoom.enable(), 1000);
                });
                }

                // Wait for map to be fully rendered before adding heat layer
                map.whenReady(() => {
                setTimeout(() => {
                    try {
                    const heatOptions: HeatLayerOptions = {
                        radius: isMobile ? 20 : 25,
                        blur: isMobile ? 12 : 15,
                        maxZoom: 18,
                        minOpacity: 0.4,
                    };

                    // Create heatmap layer but don't add data yet
                    heatLayerRef.current = LeafletLib.heatLayer([], heatOptions);
                    map.addLayer(heatLayerRef.current);

                    // Set up resize observer to handle container size changes
                    if (typeof ResizeObserver !== "undefined") {
                        resizeObserverRef.current = new ResizeObserver(() => {
                        if (mapInstanceRef.current) {
                            setTimeout(() => {
                            mapInstanceRef.current?.invalidateSize();
                            }, 100);
                        }
                        });
                        resizeObserverRef.current.observe(container);
                    }

                    setMapReady(true);
                    } catch (error) {
                    console.error("Error creating heat layer:", error);
                    setMapReady(true); // Still set ready so markers can be added
                    }
                }, 200);
                });

                // Handle zoom events to prevent heatmap errors
                map.on("zoomstart", () => {
                if (
                    heatLayerRef.current &&
                    mapInstanceRef.current?.hasLayer(heatLayerRef.current)
                ) {
                    try {
                    mapInstanceRef.current.removeLayer(heatLayerRef.current);
                    } catch (error) {
                    console.error(
                        "Error removing heat layer on zoom start:",
                        error
                    );
                    }
                }
                });

                map.on("zoomend", () => {
                if (
                    heatLayerRef.current &&
                    mapInstanceRef.current &&
                    !mapInstanceRef.current.hasLayer(heatLayerRef.current)
                ) {
                    setTimeout(() => {
                    try {
                        const container = mapContainerRef.current;
                        if (
                        container &&
                        container.offsetWidth > 0 &&
                        container.offsetHeight > 0 &&
                        heatLayerRef.current &&
                        mapInstanceRef.current
                        ) {
                        mapInstanceRef.current.addLayer(heatLayerRef.current);
                        // Re-add the data after zoom
                        if (reports && reports.length > 0) {
                            const points = reports
                            .filter(
                                (r) =>
                                r.location &&
                                r.location.lat &&
                                r.location.lng &&
                                !isNaN(r.location.lat) &&
                                !isNaN(r.location.lng) &&
                                r.location.lat >= -90 &&
                                r.location.lat <= 90 &&
                                r.location.lng >= -180 &&
                                r.location.lng <= 180
                            )
                            .map(
                                (r) =>
                                [
                                    r.location.lat,
                                    r.location.lng,
                                    Math.max(r.upvoteCount || 1, 1),
                                ] as [number, number, number]
                            );

                            safeUpdateHeatmap(points);
                        }
                        }
                    } catch (error) {
                        console.error(
                        "Error re-adding heat layer on zoom end:",
                        error
                        );
                    }
                    }, 300);
                }
                });
            } catch (error) {
                console.error("Error initializing map:", error);
            }
            };

            initWithProperDimensions();
        } catch (error) {
            console.error("Failed to initialize map:", error);
        }
        };

        initializeMap();

        // Cleanup function
        return () => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }

        if (mapInstanceRef.current) {
            try {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            heatLayerRef.current = null;
            markerLayerRef.current = null;
            setMapReady(false);
            } catch (error) {
            console.error("Error cleaning up map:", error);
            }
        }
        };
    }, [isClient, safeUpdateHeatmap, reports]);

    // Update map data when reports change
    useEffect(() => {
        if (!mapReady || !markerLayerRef.current || !reports) {
        return;
        }

        try {
        // Update heatmap safely
        if (heatLayerRef.current) {
            const points = reports
            .filter(
                (r) =>
                r.location &&
                r.location.lat &&
                r.location.lng &&
                !isNaN(r.location.lat) &&
                !isNaN(r.location.lng) &&
                r.location.lat >= -90 &&
                r.location.lat <= 90 &&
                r.location.lng >= -180 &&
                r.location.lng <= 180
            )
            .map(
                (r) =>
                [
                    r.location.lat,
                    r.location.lng,
                    Math.max(r.upvoteCount || 1, 1),
                ] as [number, number, number]
            );

            // Use safe update function
            setTimeout(() => safeUpdateHeatmap(points), 100);
        }

        // Clear existing markers
        markerLayerRef.current.clearLayers();

        // Add new markers
        if (mapInstanceRef.current && typeof window !== "undefined") {
            // Get leaflet from window after dynamic import
            const leafletModule = import("leaflet")
            .then((module) => {
                const LeafletLib = module.default as unknown as LeafletStatic;
                const customIcon = mapInstanceRef.current?._customIcon;

                if (!customIcon) return;

                reports.forEach((report) => {
                if (
                    !report.location ||
                    !report.location.lat ||
                    !report.location.lng ||
                    !markerLayerRef.current
                ) {
                    return;
                }

                try {
                    const marker = LeafletLib.marker(
                    [report.location.lat, report.location.lng],
                    {
                        icon: customIcon,
                    }
                    );

                    const getCategoryColor = (category: string) => {
                    const colors: Record<string, string> = {
                        Roads: "#f97316",
                        Electrical: "#eab308", 
                        Sanitation: "#22c55e",
                        Environment: "#3b82f6",
                        Infrastructure: "#a855f7",
                        Other: "#6b7280"
                    };
                    return colors[category] || "#6b7280";
                    };

                    const popupContent = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 280px; border-radius: 12px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, ${getCategoryColor(report.category)}, ${getCategoryColor(report.category)}cc); color: white; padding: 12px 16px; margin: -10px -10px 12px -10px;">
                        <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${report.category}</h3>
                        <div style="display: flex; align-items: center; margin-top: 6px; font-size: 0.85rem; opacity: 0.95;">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style="margin-right: 4px;">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                            </svg>
                            ${report.upvoteCount || 0} upvotes
                        </div>
                        </div>
                        <div style="padding: 0 4px;">
                        <p style="font-size: 0.9rem; margin: 0 0 12px; color: #374151; line-height: 1.5;">${report.description}</p>
                        ${
                            report.imageUrl
                            ? `<img src="${report.imageUrl}" alt="${report.category}" style="width: 100%; height: auto; border-radius: 8px; max-height: 160px; object-fit: cover; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" onerror="this.style.display='none'" />`
                            : ""
                        }
                        </div>
                    </div>
                    `;

                    marker.bindPopup(popupContent, {
                    maxWidth: 300,
                    className: "custom-popup",
                    });

                    markerLayerRef.current.addLayer(marker);
                } catch (error) {
                    console.error("Error adding marker:", error);
                }
                });
            })
            .catch((error) => {
                console.error("Error importing leaflet for markers:", error);
            });
        }
        } catch (error) {
        console.error("Error updating map data:", error);
        }
    }, [reports, mapReady, safeUpdateHeatmap]);

    if (!isClient) {
        return (
        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-800/20"></div>
            <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
            <div className="text-slate-300 font-medium">Loading Map...</div>
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="h-full w-full relative overflow-hidden rounded-lg md:rounded-none">
        <div ref={mapContainerRef} className="h-full w-full rounded-lg md:rounded-none" />
        
        {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                </div>
                <div className="text-slate-300 font-medium text-center">
                <div className="text-lg">Initializing Map...</div>
                <div className="text-sm text-slate-400 mt-1">Setting up interactive features</div>
                </div>
                <div className="flex space-x-1">
                <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
            </div>
        )}

         <style jsx>{`
      /* container subtle glow */
      .h-full.w-full.relative::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(circle at center,
          rgba(255,233,0,0.05) 0%,
          transparent 80%);
      }

      /* Leaflet background */
      :global(.leaflet-container) {
        background: radial-gradient(ellipse at center, #0f172a 0%, #020617 100%) !important;
        filter: saturate(1.1);
      }

      /* Glassy zoom controls */
      :global(.leaflet-control-zoom) {
        border: none !important;
        box-shadow: none !important;
      }
      :global(.leaflet-control-zoom a) {
        background: rgba(255, 255, 255, 0.08) !important;
        border-radius: 12px !important;
        color: #ffe900 !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(12px) saturate(180%) !important;
        box-shadow: 0 0 8px rgba(255, 233, 0, 0.4) !important;
        transition: all 0.2s ease !important;
      }
      :global(.leaflet-control-zoom a:hover) {
        background: rgba(255, 233, 0, 0.2) !important;
        color: #fff !important;
        box-shadow: 0 0 16px rgba(255, 233, 0, 0.6) !important;
      }

      /* Custom marker */
      .custom-marker-container {
        position: relative;
        width: 24px;
        height: 32px;
      }
      .custom-marker-pin {
        position: absolute;
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #ffe900 0%, #ffb700 100%) !important;
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        top: 0;
        left: 0;
        box-shadow: 0 0 8px rgba(255, 233, 0, 0.6), 0 0 20px rgba(255, 183, 0, 0.4) !important;
      }
      .custom-marker-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #fff !important;
        border-radius: 50%;
        top: 4px;
        left: 4px;
        transform: rotate(45deg);
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.7) !important;
      }

      /* Popup glass effect */
      :global(.custom-popup .leaflet-popup-content-wrapper) {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(16px) saturate(180%) !important;
        color: #f8fafc !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 24px rgba(255, 233, 0, 0.25) !important;
      }
      :global(.custom-popup .leaflet-popup-content) {
        margin: 0;
        line-height: 1.4;
        color: #e2e8f0 !important;
      }
      :global(.custom-popup .leaflet-popup-tip) {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        box-shadow: 0 2px 8px rgba(255, 233, 0, 0.2) !important;
      }

      /* make map always take full space on mobile */
      @media (max-width: 768px) {
        :global(.leaflet-container) {
          height: 100% !important;
          width: 100% !important;
        }
      }
    `}</style>
        </div>
    );
    };

    export default DashboardMap;