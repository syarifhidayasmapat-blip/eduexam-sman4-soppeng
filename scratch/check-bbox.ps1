Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile('D:\APLIKASI PASYA\EDU EXCAM SMAN 4 SOPPENG\assets\logo.png')
$minX = $img.Width
$minY = $img.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $img.Height; $y += 2) {
    for ($x = 0; $x -lt $img.Width; $x += 2) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$img.Dispose()
Write-Output "Image size: 1024 x 764"
Write-Output "Bounding Box: minX=$minX, maxX=$maxX, width=$($maxX - $minX)"
Write-Output "Bounding Box: minY=$minY, maxY=$maxY, height=$($maxY - $minY)"

