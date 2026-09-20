$pairs = @(
  @("src\app\(admin)\reports\opnames\page.tsx", 'w-full text-left text-sm', 'w-full min-w-[720px] text-left text-sm'),
  @("src\app\(admin)\reports\movements\page.tsx", 'w-full text-left text-sm', 'w-full min-w-[720px] text-left text-sm'),
  @("src\app\(admin)\reports\low-stock\page.tsx", 'w-full text-left text-sm', 'w-full min-w-[640px] text-left text-sm'),
  @("src\app\(admin)\workflow\admin\page.tsx", 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'),
  @("src\app\(supv)\workflow\supervisor\page.tsx", 'w-full text-left text-xs', 'w-full min-w-[560px] text-left text-xs'),
  @("src\app\(admin)\dashboard\admin\page.tsx", 'w-full text-left text-xs', 'w-full min-w-[420px] text-left text-xs'),
  @("src\app\(supv)\dashboard\supervisor\page.tsx", 'w-full text-left text-xs', 'w-full min-w-[560px] text-left text-xs'),
  @("src\app\(admin)\reports\opnames\page.tsx", 'min-w-[200px]', 'w-full sm:min-w-[200px] sm:w-auto')
)

foreach ($e in $pairs) {
    $p = (Resolve-Path $e[0])
    $c = [System.IO.File]::ReadAllText($p)
    if ($c.Contains($e[1])) {
        [System.IO.File]::WriteAllText($p, $c.Replace($e[1], $e[2]))
        Write-Output ("ok: " + $e[0] + " :: " + $e[1])
    }
    else {
        Write-Output ("MISS: " + $e[0] + " :: " + $e[1])
    }
}
