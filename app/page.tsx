'use client'

import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { getUrlWithConfig } from 'wolfy-module-kit'
import { ConfigForm } from '@/components/ConfigForm/ConfigForm'
import configSchema, { type ModuleConfig, DEFAULT_CONFIG } from "@/system/configuration"
import { FORM_FIELDS } from "@/components/ConfigForm/formFields"


export default function HomePage() {
  const router = useRouter()
  const handleFormSubmit = useCallback((config: ModuleConfig, configString: string, signature: string = '') => {

    // Use modular URL utilities
    const url = getUrlWithConfig(configString, signature)

    // Trigger re-processing by reloading
    router.push('/game/?' + url.toString())
  }, [])

  return (
    <main className="min-h-screen bg-gray-100">
      <ConfigForm<ModuleConfig>
        title="Configure Detective Timeline Puzzle"
        description="Configure your detective timeline puzzle settings below."
        fields={FORM_FIELDS}
        defaultValues={DEFAULT_CONFIG}
        schema={configSchema}
        onSubmit={handleFormSubmit}
        submitButtonText="Start Timeline Puzzle"
        footerText="🕵️ Detective Timeline Puzzle: Arrange evidence in chronological order to solve murder mysteries!"
      />
    </main>
  );
}
