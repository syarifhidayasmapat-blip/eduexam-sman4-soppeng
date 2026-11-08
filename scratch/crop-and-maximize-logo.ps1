Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Asus\.gemini\antigravity\brain\adaae41f-4c82-4237-9009-8306bf3e750f\.user_uploaded\media_1794102462365_07803b28.jpg"
$baseDir = Split-Path -Parent $PSScriptRoot

$assetsLogoPng = Join-Path $baseDir "assets\logo.png"
$rootIcon192 = Join-Path $baseDir "icon-192.png"
$rootIcon512 = Join-Path $baseDir "icon-512.png"
$publicIcon192 = Join-Path $baseDir "public\icon-192.png"
$publicIcon512 = Join-Path $baseDir "public\icon-512.png"

$origImg = [System.Drawing.Image]::FromFile($sourcePath)

# 1. Detect exact bounding box with tight padding
$origBmp = New-Object System.Drawing.Bitmap($origImg)
$minX = $origImg.Width
$minY = $origImg.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $origImg.Height; $y += 2) {
    for ($x = 0; $x -lt $origImg.Width; $x += 2) {
        $p = $origBmp.GetPixel($x, $y)
        if ($p.R -lt 242 -or $p.G -lt 242 -or $p.B -lt 242) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$origBmp.Dispose()

Write-Output "Detected Logo Content: minX=$minX, maxX=$maxX, minY=$minY, maxY=$maxY"

# Add small margin (8px)
$pad = 8
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($origImg.Width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($origImg.Height - $cropY, ($maxY - $minY) + ($pad * 2))

Write-Output "Cropping to: X=$cropX, Y=$cropY, W=$cropW, H=$cropH"

# Create tightly cropped Bitmap
$croppedBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gCrop = [System.Drawing.Graphics]::FromImage($croppedBmp)
$gCrop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gCrop.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gCrop.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gCrop.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$gCrop.Clear([System.Drawing.Color]::White)

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
$gCrop.DrawImage($origImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()

# Save tightly cropped logo to assets/logo.png
$croppedBmp.Save($assetsLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved maximized cropped logo to assets/logo.png ($cropW x $cropH)"

# Helper function to generate square icon that fills maximum size (98% of canvas)
function Create-MaxSquareIcon([int]$targetSize, [string]$outputPath) {
    $destBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::White)

    # Maximize scale: fill 98% of canvas size
    $fillRatio = 0.98
    $scale = [Math]::Min(($targetSize * $fillRatio) / $cropW, ($targetSize * $fillRatio) / $cropH)
    $drawW = [int]($cropW * $scale)
    $drawH = [int]($cropH * $scale)
    $drawX = [int](($targetSize - $drawW) / 2)
    $drawY = [int](($targetSize - $drawH) / 2)

    $dRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
    $sRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($croppedBmp, $dRect, $sRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Output "Saved $targetSize x $targetSize maximized icon -> $outputPath"
}

# Generate 192x192 icons
Create-MaxSquareIcon 192 $rootIcon192
Copy-Item -Path $rootIcon192 -Destination $publicIcon192 -Force

# Generate 512x512 icons
Create-MaxSquareIcon 512 $rootIcon512
Copy-Item -Path $rootIcon512 -Destination $publicIcon512 -Force

$croppedBmp.Dispose()
$origImg.Dispose()

Write-Output "Crop and icon maximization complete!"

