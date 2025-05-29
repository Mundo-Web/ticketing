<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Technical;
use Illuminate\Http\Request;

class TechnicalController extends Controller
{
    /**
     * List all technicals (for jefe view)
     */    public function index()
    {
        $technicals = Technical::select('id', 'name', 'email', 'photo', 'shift', 'status', 'is_default')->get();
        \Illuminate\Support\Facades\Log::info('API /api/technicals llamado. Técnicos encontrados: ' . $technicals->count());
        return response()->json(['technicals' => $technicals]);
    }
}
