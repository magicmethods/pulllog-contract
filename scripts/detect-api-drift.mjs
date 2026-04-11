#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const FRONTEND_INTERNAL_EXCLUSIONS = [
    { method: 'POST', path: '/auth/demoLogin', label: 'frontend internal helper: POST /auth/demoLogin' },
]

main().catch((error) => {
    console.error('[detect-api-drift] Failed to run:', error instanceof Error ? error.message : error)
    process.exit(1)
})

async function main() {
    const args = parseArgs(process.argv.slice(2))
    const source = String(args.source ?? 'all').toLowerCase()
    const format = String(args.format ?? 'md').toLowerCase()
    const failOnDrift = Boolean(args['fail-on-drift'])
    const outputPath = typeof args.output === 'string' ? args.output : ''

    if (!['frontend', 'backend', 'all'].includes(source)) {
        throw new Error(`Unsupported --source value: ${source}`)
    }

    if (!['md', 'json'].includes(format)) {
        throw new Error(`Unsupported --format value: ${format}`)
    }

    const contractRoot = process.cwd()
    const repoRoot = path.resolve(contractRoot, '..')

    const locations = {
        schemaIndex: path.join(contractRoot, 'api-schema.yaml'),
        frontendEndpoints: path.join(repoRoot, 'frontend', 'api', 'endpoints.ts'),
        frontendServerApi: path.join(repoRoot, 'frontend', 'server', 'api'),
        backendStableRoutes: path.join(repoRoot, 'backend', 'stable', 'routes', 'api.php'),
    }

    const contractEntries = await extractContractEntries(locations.schemaIndex)
    const frontendEntries = source === 'backend'
        ? []
        : await extractFrontendEntries(locations.frontendEndpoints, locations.frontendServerApi)
    const backendEntries = source === 'frontend'
        ? []
        : await extractBackendEntries(locations.backendStableRoutes)

    const report = buildReport({
        source,
        locations,
        contractEntries,
        frontendEntries,
        backendEntries,
    })

    const rendered = format === 'json'
        ? `${JSON.stringify(report, null, 2)}\n`
        : renderMarkdownReport(report)

    if (outputPath) {
        const resolved = path.isAbsolute(outputPath)
            ? outputPath
            : path.join(contractRoot, outputPath)
        fs.mkdirSync(path.dirname(resolved), { recursive: true })
        fs.writeFileSync(resolved, rendered, 'utf8')
    }

    process.stdout.write(rendered)

    if (failOnDrift && report.summary.missingInContract > 0) {
        process.exitCode = 1
    }
}

function parseArgs(argv) {
    const args = {}

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]
        if (!token.startsWith('--')) {
            continue
        }

        const trimmed = token.slice(2)
        const [key, inlineValue] = trimmed.split('=', 2)

        if (inlineValue !== undefined) {
            args[key] = inlineValue
            continue
        }

        const next = argv[index + 1]
        if (next && !next.startsWith('--')) {
            args[key] = next
            index += 1
            continue
        }

        args[key] = true
    }

    return args
}

async function extractContractEntries(schemaIndexPath) {
    const schemaIndex = fs.readFileSync(schemaIndexPath, 'utf8')
    const refs = []
    const lines = schemaIndex.split(/\r?\n/)
    let inPaths = false
    let currentPath = ''

    for (const line of lines) {
        if (/^paths:\s*$/.test(line)) {
            inPaths = true
            continue
        }

        if (inPaths && /^components:\s*$/.test(line)) {
            break
        }

        if (!inPaths) {
            continue
        }

        const pathMatch = line.match(/^  (\/[^:]+):\s*$/)
        if (pathMatch) {
            currentPath = normalizePath(pathMatch[1])
            continue
        }

        const refMatch = line.match(/^    \$ref:\s+['"]?\.\/(.+?)#.+['"]?\s*$/)
        if (currentPath && refMatch) {
            refs.push({
                path: currentPath,
                filePath: path.join(path.dirname(schemaIndexPath), refMatch[1]),
            })
        }
    }

    const entries = []
    for (const ref of refs) {
        const methods = extractMethodsFromPathFile(ref.filePath, ref.path)
        for (const method of methods) {
            entries.push(createEntry(method, ref.path, 'contract', relativeFromCwd(ref.filePath)))
        }
    }

    return dedupeEntries(entries)
}

function extractMethodsFromPathFile(filePath, targetPath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)
    const methods = new Set()
    const targetPattern = new RegExp(`^['\"]?${escapeRegExp(targetPath)}['\"]?:\\s*$`)
    let inBlock = false

    for (const line of lines) {
        if (!inBlock && targetPattern.test(line.trim())) {
            inBlock = true
            continue
        }

        if (!inBlock) {
            continue
        }

        if (/^\/[^:]+:\s*$/.test(line.trim())) {
            break
        }

        const methodMatch = line.match(/^  (get|post|put|patch|delete|head|options):\s*$/i)
        if (methodMatch) {
            methods.add(methodMatch[1].toUpperCase())
        }
    }

    return methods
}

async function extractFrontendEntries(endpointsFilePath, serverApiRoot) {
    const entries = []

    if (fs.existsSync(endpointsFilePath)) {
        const endpointsContent = fs.readFileSync(endpointsFilePath, 'utf8')
        const lines = endpointsContent.split(/\r?\n/)

        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index]
            const trimmed = line.trim()
            if (trimmed.startsWith('//') || !line.includes('useConfig().apiProxy')) {
                continue
            }

            const pathMatch = line.match(/\$\{useConfig\(\)\.apiProxy\}([^`'"]+)/)
            if (!pathMatch) {
                continue
            }

            let method = ''
            for (let cursor = index; cursor <= Math.min(index + 6, lines.length - 1); cursor += 1) {
                const methodMatch = lines[cursor].match(/\/\/\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i)
                if (methodMatch) {
                    method = methodMatch[1].toUpperCase()
                    break
                }
            }

            if (method) {
                entries.push(createEntry(method, pathMatch[1], 'frontend', relativeFromCwd(endpointsFilePath)))
            }
        }
    }

    if (fs.existsSync(serverApiRoot)) {
        const files = listFilesRecursively(serverApiRoot, (candidate) => candidate.endsWith('.ts'))
        for (const filePath of files) {
            if (filePath.includes('[...path].ts')) {
                continue
            }

            const content = fs.readFileSync(filePath, 'utf8')
            if (!content.includes('apiBaseURL')) {
                continue
            }

            const urlMatch = content.match(/`\$\{apiBaseURL\}([^`]+)`/)
            if (!urlMatch || urlMatch[1].includes('${path}')) {
                continue
            }

            const inferredMethod = filePath.match(/\.(get|post|put|patch|delete)\.ts$/i)?.[1]?.toUpperCase()
            const explicitMethod = content.match(/proxyFetchAndReturn\([\s\S]*?["'](POST|PUT|PATCH|DELETE|HEAD|OPTIONS)["']/i)?.[1]?.toUpperCase()
            const method = inferredMethod || explicitMethod || 'GET'

            entries.push(createEntry(method, urlMatch[1], 'frontend', relativeFromCwd(filePath)))
        }
    }

    return dedupeEntries(entries.filter((entry) => !shouldIgnoreEntry(entry)))
}

function shouldIgnoreEntry(entry) {
    return entry.source === 'frontend' && FRONTEND_INTERNAL_EXCLUSIONS.some((rule) => (
        entry.method === rule.method && toComparisonPath(entry.path) === toComparisonPath(rule.path)
    ))
}

async function extractBackendEntries(routesFilePath) {
    if (!fs.existsSync(routesFilePath)) {
        return []
    }

    const content = fs.readFileSync(routesFilePath, 'utf8')
    const lines = content.split(/\r?\n/)
    const prefixStack = []
    const entries = []
    let pendingPrefix = ''

    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('//')) {
            continue
        }

        const prefixOnlyMatch = line.match(/Route::prefix\((.+?)\)/)
        if (prefixOnlyMatch) {
            pendingPrefix = normalizePrefixArgument(prefixOnlyMatch[1])
        }

        if (line.includes('->group(function () {') && prefixOnlyMatch) {
            prefixStack.push(pendingPrefix)
            pendingPrefix = ''
        } else if (line.includes('->group(function () {') && pendingPrefix) {
            prefixStack.push(pendingPrefix)
            pendingPrefix = ''
        }

        const routeMatch = line.match(/Route::(get|post|put|patch|delete|head|options)\(\s*'([^']+)'/i)
        if (routeMatch) {
            const method = routeMatch[1].toUpperCase()
            const routePath = routeMatch[2]
            const prefix = prefixStack.filter(Boolean).join('/')
            const fullPath = normalizePath(`/${prefix}/${routePath}`)
            if (fullPath !== '/dummy') {
                entries.push(createEntry(method, fullPath, 'backend', relativeFromCwd(routesFilePath)))
            }
        }

        const closingCount = (line.match(/\}\);/g) ?? []).length
        for (let index = 0; index < closingCount; index += 1) {
            prefixStack.pop()
        }
    }

    return dedupeEntries(entries)
}

function normalizePrefixArgument(argument) {
    if (argument.includes('config(') || argument.includes('api.base_uri')) {
        return ''
    }

    const quoted = argument.match(/['"]([^'"]*)['"]/)?.[1] ?? ''
    if (!quoted || quoted === 'v1' || quoted === 'beta') {
        return ''
    }

    return normalizePath(quoted).replace(/^\//, '')
}

function createEntry(method, rawPath, source, evidencePath) {
    const pathValue = normalizePath(rawPath)
    return {
        method: method.toUpperCase(),
        path: pathValue,
        compareKey: `${method.toUpperCase()} ${toComparisonPath(pathValue)}`,
        source,
        evidence: [evidencePath],
    }
}

function dedupeEntries(entries) {
    const map = new Map()

    for (const entry of entries) {
        const existing = map.get(entry.compareKey)
        if (!existing) {
            map.set(entry.compareKey, {
                ...entry,
                evidence: [...entry.evidence],
            })
            continue
        }

        existing.evidence = Array.from(new Set([...existing.evidence, ...entry.evidence]))
        if (existing.path.includes('{param}') && !entry.path.includes('{param}')) {
            existing.path = entry.path
        }
    }

    return Array.from(map.values()).sort((left, right) => `${left.method} ${left.path}`.localeCompare(`${right.method} ${right.path}`))
}

function buildReport({ source, locations, contractEntries, frontendEntries, backendEntries }) {
    const contractMap = toEntryMap(contractEntries)
    const frontendMap = toEntryMap(frontendEntries)
    const backendMap = toEntryMap(backendEntries)

    const observedKeys = new Set([...frontendMap.keys(), ...backendMap.keys()])

    const missingInContract = []
    for (const key of observedKeys) {
        if (contractMap.has(key)) {
            continue
        }

        const frontendEntry = frontendMap.get(key)
        const backendEntry = backendMap.get(key)
        const sample = backendEntry ?? frontendEntry

        missingInContract.push({
            method: sample.method,
            path: sample.path,
            sources: [frontendEntry ? 'frontend' : '', backendEntry ? 'backend-stable' : ''].filter(Boolean),
            evidence: uniqueStrings([
                ...(frontendEntry?.evidence ?? []),
                ...(backendEntry?.evidence ?? []),
            ]),
        })
    }

    const frontendOnly = []
    for (const [key, entry] of frontendMap.entries()) {
        if (!backendMap.has(key)) {
            frontendOnly.push({
                method: entry.method,
                path: entry.path,
                evidence: entry.evidence,
            })
        }
    }

    const backendOnly = []
    for (const [key, entry] of backendMap.entries()) {
        if (!frontendMap.has(key)) {
            backendOnly.push({
                method: entry.method,
                path: entry.path,
                evidence: entry.evidence,
            })
        }
    }

    const contractOnly = []
    for (const [key, entry] of contractMap.entries()) {
        if (!observedKeys.has(key)) {
            contractOnly.push({
                method: entry.method,
                path: entry.path,
                evidence: entry.evidence,
            })
        }
    }

    return {
        meta: {
            generatedAt: new Date().toISOString(),
            source,
            backendScope: 'stable-only',
            ignored: ['backend/beta/**', ...FRONTEND_INTERNAL_EXCLUSIONS.map((rule) => rule.label)],
            files: {
                contract: relativeFromCwd(locations.schemaIndex),
                frontend: relativeFromCwd(locations.frontendEndpoints),
                backend: relativeFromCwd(locations.backendStableRoutes),
            },
        },
        summary: {
            contractEndpoints: contractEntries.length,
            frontendObserved: frontendEntries.length,
            backendObserved: backendEntries.length,
            missingInContract: missingInContract.length,
            frontendOnly: frontendOnly.length,
            backendOnly: backendOnly.length,
            contractOnly: contractOnly.length,
        },
        missingInContract: sortItems(missingInContract),
        frontendOnly: sortItems(frontendOnly),
        backendOnly: sortItems(backendOnly),
        contractOnly: sortItems(contractOnly),
    }
}

function toEntryMap(entries) {
    const map = new Map()
    for (const entry of entries) {
        map.set(entry.compareKey, entry)
    }
    return map
}

function sortItems(items) {
    return [...items].sort((left, right) => `${left.method} ${left.path}`.localeCompare(`${right.method} ${right.path}`))
}

function renderMarkdownReport(report) {
    const lines = []

    lines.push('# PullLog API Drift Report')
    lines.push('')
    lines.push(`- Generated: ${report.meta.generatedAt}`)
    lines.push(`- Scope: ${report.meta.source}`)
    lines.push(`- Backend scope: ${report.meta.backendScope}`)
    lines.push(`- Ignored: ${report.meta.ignored.join(', ')}`)
    lines.push('')
    lines.push('## Summary')
    lines.push('')
    lines.push('| Check | Count |')
    lines.push('| --- | ---: |')
    lines.push(`| Contract endpoints | ${report.summary.contractEndpoints} |`)
    lines.push(`| Frontend observed | ${report.summary.frontendObserved} |`)
    lines.push(`| Stable backend observed | ${report.summary.backendObserved} |`)
    lines.push(`| Missing in contract | ${report.summary.missingInContract} |`)
    lines.push(`| Frontend only | ${report.summary.frontendOnly} |`)
    lines.push(`| Stable backend only | ${report.summary.backendOnly} |`)
    lines.push(`| Contract only | ${report.summary.contractOnly} |`)
    lines.push('')

    renderSection(lines, 'Missing in contract', report.missingInContract, (item) => {
        lines.push(`- \`${item.method} ${item.path}\` — sources: ${item.sources.join(', ') || 'unknown'}`)
        if (item.evidence.length > 0) {
            lines.push(`  - evidence: ${item.evidence.map((value) => `\`${value}\``).join(', ')}`)
        }
    })

    renderSection(lines, 'Frontend only', report.frontendOnly, (item) => {
        lines.push(`- \`${item.method} ${item.path}\``)
        if (item.evidence.length > 0) {
            lines.push(`  - evidence: ${item.evidence.map((value) => `\`${value}\``).join(', ')}`)
        }
    })

    renderSection(lines, 'Stable backend only', report.backendOnly, (item) => {
        lines.push(`- \`${item.method} ${item.path}\``)
        if (item.evidence.length > 0) {
            lines.push(`  - evidence: ${item.evidence.map((value) => `\`${value}\``).join(', ')}`)
        }
    })

    renderSection(lines, 'Contract only', report.contractOnly, (item) => {
        lines.push(`- \`${item.method} ${item.path}\``)
        if (item.evidence.length > 0) {
            lines.push(`  - evidence: ${item.evidence.map((value) => `\`${value}\``).join(', ')}`)
        }
    })

    lines.push('## Notes')
    lines.push('')
    lines.push('- Path comparison is parameter-name tolerant. For example, `{id}` and `{assetId}` are treated as the same segment for drift detection.')
    lines.push('- This script is deterministic and intended to support, not replace, human review and the custom agents under `.github/agents/`.')
    lines.push('')

    return `${lines.join('\n')}\n`
}

function renderSection(lines, title, items, renderer) {
    lines.push(`## ${title}`)
    lines.push('')

    if (items.length === 0) {
        lines.push('- None')
        lines.push('')
        return
    }

    for (const item of items) {
        renderer(item)
    }
    lines.push('')
}

function normalizePath(rawPath) {
    let normalized = String(rawPath).trim()
    normalized = normalized.replace(/https?:\/\/[^/]+/g, '')
    normalized = normalized.replace(/\$\{([^}]+)\}/g, (_match, expression) => `{${toParamName(expression)}}`)
    normalized = normalized.replace(/\?.*$/, '')
    normalized = normalized.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, '{$1}')
    normalized = normalized.replace(/\/+/g, '/')

    if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`
    }

    if (normalized.length > 1) {
        normalized = normalized.replace(/\/$/, '')
    }

    return normalized
}

function toComparisonPath(pathValue) {
    return normalizePath(pathValue).replace(/\{[^}]+\}/g, '{param}')
}

function toParamName(expression) {
    const raw = String(expression).split('.').pop() ?? 'param'
    const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '')
    return cleaned || 'param'
}

function uniqueStrings(values) {
    return Array.from(new Set(values.filter(Boolean)))
}

function relativeFromCwd(targetPath) {
    return path.relative(process.cwd(), targetPath).replace(/\\/g, '/')
}

function listFilesRecursively(rootPath, predicate) {
    const results = []
    const queue = [rootPath]

    while (queue.length > 0) {
        const current = queue.shift()
        if (!current) {
            continue
        }

        const items = fs.readdirSync(current, { withFileTypes: true })
        for (const item of items) {
            const resolved = path.join(current, item.name)
            if (item.isDirectory()) {
                queue.push(resolved)
            } else if (predicate(resolved)) {
                results.push(resolved)
            }
        }
    }

    return results
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
