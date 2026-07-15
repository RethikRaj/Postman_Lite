import { createContext, useContext, useEffect, useState } from "react";
import {
  loadCollections,
  saveCollections,
  loadEnvironments,
  saveEnvironments,
  loadActiveEnvId,
  saveActiveEnvId,
  generateId,
} from "../lib/storage";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [collections, setCollections] = useState(() => loadCollections());
  const [environments, setEnvironments] = useState(() => loadEnvironments());
  const [activeEnvId, setActiveEnvId] = useState(() => loadActiveEnvId());

  useEffect(() => saveCollections(collections), [collections]);
  useEffect(() => saveEnvironments(environments), [environments]);
  useEffect(() => saveActiveEnvId(activeEnvId), [activeEnvId]);

  // ---- Collections ----
  function createCollection(name) {
    const newCollection = { id: generateId("col"), name, requests: [] };
    setCollections((prev) => [...prev, newCollection]);
    return newCollection;
  }

  function deleteCollection(collectionId) {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
  }

  function renameCollection(collectionId, name) {
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, name } : c))
    );
  }

  // ---- Requests (always belong to a collection) ----
  function saveRequestToCollection(collectionId, requestDraft, existingRequestId) {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== collectionId) return c;
        if (existingRequestId) {
          return {
            ...c,
            requests: c.requests.map((r) =>
              r.id === existingRequestId ? { ...requestDraft, id: existingRequestId } : r
            ),
          };
        }
        const newRequest = { ...requestDraft, id: generateId("req") };
        return { ...c, requests: [...c.requests, newRequest] };
      })
    );
  }

  function deleteRequest(collectionId, requestId) {
    setCollections((prev) =>
      prev.map((c) =>
        c.id !== collectionId
          ? c
          : { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
      )
    );
  }

  // ---- Environments ----
  function createEnvironment(name) {
    const newEnv = { id: generateId("env"), name, variables: [] };
    setEnvironments((prev) => [...prev, newEnv]);
    return newEnv;
  }

  function updateEnvironment(envId, updates) {
    setEnvironments((prev) =>
      prev.map((e) => (e.id === envId ? { ...e, ...updates } : e))
    );
  }

  function deleteEnvironment(envId) {
    setEnvironments((prev) => prev.filter((e) => e.id !== envId));
    if (activeEnvId === envId) setActiveEnvId(null);
  }

  const activeEnv = environments.find((e) => e.id === activeEnvId) || null;

  const value = {
    collections,
    environments,
    activeEnvId,
    activeEnv,
    setActiveEnvId,
    createCollection,
    deleteCollection,
    renameCollection,
    saveRequestToCollection,
    deleteRequest,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
