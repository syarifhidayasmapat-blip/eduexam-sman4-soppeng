Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Asus\.gemini\antigravity\brain\adaae41f-4c82-4237-9009-8306bf3e750f\.user_uploaded\media_1794102462365_07803b28.jpg"
$baseDir = Split-Path -Parent $PSScriptRoot

$assetsLogoPng = Join-Path $baseDir "assets\logo.png"
$rootIcon192 = Join-Path $baseDir "icon-192.png"
$rootIcon512 = Join-Path $baseDir "icon-512.png"
$publicIcon192 = Join-Path $baseDir "public\icon-192.png"
$publicIcon512 = Join-Path $baseDir "public\icon-512.png"

Write-Output "Loading source image: $sourcePath"
$srcImg = [System.Drawing.Image]::FromFile($sourcePath)
Write-Output "Source Dimensions: $($srcImg.Width) x $($srcImg.Height)"

# 1. Save original to assets/logo.png as high quality PNG
Write-Output "Saving assets/logo.png..."
$srcBmp = New-Object System.Drawing.Bitmap($srcImg)
$srcBmp.Save($assetsLogoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$srcBmp.Dispose()

# Helper function to create square icon with padding and white/transparent background
function Create-SquareIcon([int]$targetSize, [string]$outputPath) {
    Write-Output "Generating $targetSize x $targetSize icon -> $outputPath"
    $destBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Fill with white background (matches the logo background)
    $g.Clear([System.Drawing.Color]::White)
    
    # Calculate scaled dimensions (with 92% fill to leave nice icon margins)
    $paddingRatio = 0.94
    $scale = [Math]::Min(($targetSize * $paddingRatio) / $srcImg.Width, ($targetSize * $paddingRatio) / $srcImg.Height)
    $drawW = [int]($srcImg.Width * $scale)
    $drawH = [int]($srcImg.Height * $scale)
    $drawX = [int](($targetSize - $drawW) / 2)
    $drawY = [int](($targetSize - $drawH) / 2)
    
    $destRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $srcImg.Width, $srcImg.Height)
    
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $g.Dispose()
    
    # Save to file
    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
}

# 2. Generate 192x192 icons
Create-SquareIcon 192 $rootIcon192
Copy-Item -Path $rootIcon192 -Destination $publicIcon192 -Force

# 3. Generate 512x512 icons
Create-SquareIcon 512 $rootIcon512
Copy-Item -Path $rootIcon512 -Destination $publicIcon512 -Force

$srcImg.Dispose()
Write-Output "All logo files and PWA icons updated successfully!"

